import { Result } from '@app/kernel';
import { Email } from '../dominio/email.vo';
import { BLOQUEIO_LOGIN_IP, BLOQUEIO_REDEFINICAO } from '../dominio/politica-bloqueio.service';
import type { ContextoPublico, DependenciasIdentity } from './portas';

export const TOKEN_REDEFINICAO_VALIDADE_MS = 30 * 60_000;

/**
 * Resposta SEMPRE igual (sucesso), exista ou não o e-mail — impede enumeração de contas.
 * O limite é aplicado silenciosamente: excedeu, simplesmente não envia.
 */
export class SolicitarRedefinicaoSenha {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: { email: string }, ctx: ContextoPublico): Promise<Result<void>> {
    const agora = this.d.relogio.agora();
    const email = Email.criar(e.email);
    if (email.falhou) return Result.ok();

    const chaveConta = `redefinicao:conta:${email.valor.valor}`;
    const chaveIp = `redefinicao:ip:${ctx.ip}`;
    const [conta, ip] = await Promise.all([this.d.limitador.estado(chaveConta, agora), this.d.limitador.estado(chaveIp, agora)]);
    // Cada solicitação conta como "tentativa": limita o volume de e-mails por conta e por IP.
    await this.d.limitador.registrarFalha(chaveConta, BLOQUEIO_REDEFINICAO, agora);
    await this.d.limitador.registrarFalha(chaveIp, BLOQUEIO_LOGIN_IP, agora);
    if (conta.bloqueadoAte || ip.bloqueadoAte) return Result.ok();

    const usuario = await this.d.usuarios.buscarPorEmail(email.valor);
    if (!usuario || usuario.podeAutenticar().falhou) return Result.ok();

    const token = this.d.aleatorio.token();
    await this.d.tokensRedefinicao.salvar(this.d.cifrador.indiceCego(`redefinicao:${token}`), usuario.id, new Date(agora.getTime() + TOKEN_REDEFINICAO_VALIDADE_MS));
    await this.d.email.enviar({
      para: usuario.email.valor,
      modelo: 'REDEFINIR_SENHA',
      dados: { link: `${this.d.config.urlApp}/redefinir-senha?token=${encodeURIComponent(token)}`, validadeMinutos: 30 },
    });
    await this.d.auditoria.registrar('REDEFINICAO_SOLICITADA', { usuarioId: usuario.id.valor, ip: ctx.ip });
    return Result.ok();
  }
}
