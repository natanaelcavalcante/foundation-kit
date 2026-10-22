import { falha, Result } from '@app/kernel';
import { SenhaNova } from '../dominio/senha-nova.vo';
import type { ContextoPublico, DependenciasIdentity } from './portas';

export interface RedefinirSenhaEntrada { token: string; novaSenha: string }

export class RedefinirSenha {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: RedefinirSenhaEntrada, ctx: ContextoPublico): Promise<Result<void>> {
    const agora = this.d.relogio.agora();
    const senha = SenhaNova.criar(e.novaSenha, 'novaSenha');
    if (senha.falhou) return Result.fail(senha.falhas);
    if (await this.d.senhasVazadas.vazada(senha.valor.valor)) {
      return Result.fail(falha('SENHA_VAZADA', 'validacao', { campo: 'novaSenha' }));
    }

    const usuarioId = typeof e.token === 'string' && e.token.length > 0
      ? await this.d.tokensRedefinicao.consumir(this.d.cifrador.indiceCego(`redefinicao:${e.token}`), agora)
      : null;
    const usuario = usuarioId ? await this.d.usuarios.buscarPorId(usuarioId) : null;
    if (!usuario || usuario.podeAutenticar().falhou) return Result.fail(falha('TOKEN_INVALIDO', 'validacao', { campo: 'token' }));

    usuario.trocarSenha(await this.d.hasher.hash(senha.valor.valor), agora);
    await this.d.usuarios.salvar(usuario);
    await this.d.sessoes.revogarTodas(usuario.id);
    await this.d.limitador.limpar(`login:conta:${usuario.email.valor}`);
    await this.d.auditoria.registrar('SENHA_REDEFINIDA', { usuarioId: usuario.id.valor, ip: ctx.ip });
    await this.d.email.enviar({ para: usuario.email.valor, modelo: 'SENHA_ALTERADA', dados: { ip: ctx.ip } });
    return Result.ok();
  }
}
