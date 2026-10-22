import { Result } from '@app/kernel';
import { hashCodigoRecuperacao } from './codigo-email';
import { carregarDesafio, falhaNoDesafio } from './desafio';
import type { ContextoPublico, DependenciasIdentity } from './portas';

export interface ConfirmarCadastroMfaEntrada { desafioId: string; codigo: string }
export interface ConfirmarCadastroMfaSaida { token: string; codigosRecuperacao: string[] }

export const QUANTIDADE_CODIGOS_RECUPERACAO = 10;

/** Primeiro login: o usuário escaneou o QR Code e prova que o app gera o código certo. */
export class ConfirmarCadastroMfa {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: ConfirmarCadastroMfaEntrada, ctx: ContextoPublico): Promise<Result<ConfirmarCadastroMfaSaida>> {
    const agora = this.d.relogio.agora();
    const carga = await carregarDesafio(this.d, e.desafioId, 'CADASTRO', agora);
    if (carga.falhou) return Result.fail(carga.falhas);
    const { desafio, usuario } = carga.valor;

    const segredoCifrado = usuario.mfa.segredoCifrado;
    const passo = segredoCifrado ? this.d.totp.verificar(await this.d.cifrador.decifrar(segredoCifrado), String(e.codigo ?? ''), agora) : null;
    if (passo === null || usuario.registrarPassoTotp(passo).falhou) return falhaNoDesafio(this.d, desafio, ctx.ip);

    const codigos = Array.from({ length: QUANTIDADE_CODIGOS_RECUPERACAO }, () => this.d.aleatorio.codigoRecuperacao());
    const confirmado = usuario.confirmarMfa(codigos.map((c) => hashCodigoRecuperacao(this.d, c)), agora);
    if (confirmado.falhou) return Result.fail(confirmado.falhas);

    await this.d.usuarios.salvar(usuario);
    await this.d.desafios.remover(desafio.id);
    const token = await this.d.sessoes.criar(usuario.id, { ip: ctx.ip, userAgent: ctx.userAgent });
    await this.d.auditoria.registrar('MFA_ATIVADO', { usuarioId: usuario.id.valor, ip: ctx.ip });
    await this.d.email.enviar({ para: usuario.email.valor, modelo: 'MFA_ATIVADO', dados: { ip: ctx.ip } });
    return Result.ok({ token, codigosRecuperacao: codigos });
  }
}
