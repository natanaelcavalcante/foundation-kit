import { falha, Result } from '@app/kernel';
import { hashCodigoEmail, hashCodigoRecuperacao } from './codigo-email';
import { carregarDesafio, falhaNoDesafio } from './desafio';
import type { ContextoPublico, DependenciasIdentity } from './portas';

export type MetodoVerificacao = 'TOTP' | 'EMAIL' | 'RECUPERACAO';
export interface VerificarMfaEntrada { desafioId: string; codigo: string; metodo: MetodoVerificacao }
export interface VerificarMfaSaida { token: string; codigosRecuperacaoRestantes: number }

export class VerificarMfa {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: VerificarMfaEntrada, ctx: ContextoPublico): Promise<Result<VerificarMfaSaida>> {
    const agora = this.d.relogio.agora();
    const carga = await carregarDesafio(this.d, e.desafioId, 'VERIFICACAO', agora);
    if (carga.falhou) return Result.fail(carga.falhas);
    const { desafio, usuario } = carga.valor;
    const codigo = String(e.codigo ?? '');

    let aceito: Result<void>;
    switch (e.metodo) {
      case 'TOTP': {
        const segredo = usuario.mfa.segredoCifrado;
        const passo = segredo ? this.d.totp.verificar(await this.d.cifrador.decifrar(segredo), codigo, agora) : null;
        aceito = passo === null ? Result.fail(falha('CODIGO_INVALIDO', 'nao_autenticado')) : usuario.registrarPassoTotp(passo);
        break;
      }
      case 'EMAIL':
        aceito = desafio.verificarCodigoEmail(hashCodigoEmail(this.d, desafio.id.valor, codigo), agora);
        break;
      case 'RECUPERACAO':
        aceito = usuario.consumirCodigoRecuperacao(hashCodigoRecuperacao(this.d, codigo), agora);
        break;
      default:
        return Result.fail(falha('METODO_INVALIDO', 'validacao', { campo: 'metodo' }));
    }
    if (aceito.falhou) return falhaNoDesafio(this.d, desafio, ctx.ip);

    await this.d.usuarios.salvar(usuario);
    await this.d.desafios.remover(desafio.id);
    const token = await this.d.sessoes.criar(usuario.id, { ip: ctx.ip, userAgent: ctx.userAgent });
    await this.d.auditoria.registrar('LOGIN_SUCESSO', { usuarioId: usuario.id.valor, ip: ctx.ip, mfa: e.metodo });
    if (e.metodo === 'RECUPERACAO') {
      await this.d.email.enviar({
        para: usuario.email.valor,
        modelo: 'CODIGO_RECUPERACAO_USADO',
        dados: { ip: ctx.ip, restantes: usuario.codigosRecuperacaoRestantes },
      });
    }
    return Result.ok({ token, codigosRecuperacaoRestantes: usuario.codigosRecuperacaoRestantes });
  }
}
