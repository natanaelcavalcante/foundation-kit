import { falha, Result } from '@app/kernel';
import { DesafioMfa } from '../dominio/desafio-mfa.entity';
import { Email } from '../dominio/email.vo';
import { BLOQUEIO_LOGIN_CONTA, BLOQUEIO_LOGIN_IP } from '../dominio/politica-bloqueio.service';
import type { Usuario } from '../dominio/usuario.entity';
import { emitirCodigoEmail } from './codigo-email';
import type { ContextoPublico, DependenciasIdentity } from './portas';

export interface AutenticarEntrada { email: string; senha: string }

export type AutenticarSaida =
  | { etapa: 'SESSAO'; token: string }
  | { etapa: 'MFA_CADASTRO'; desafioId: string; segredo: string; uri: string }
  | { etapa: 'MFA_DESAFIO'; desafioId: string; metodo: 'TOTP' | 'EMAIL'; emailMascarado: string };

const CREDENCIAIS_INVALIDAS = falha('CREDENCIAIS_INVALIDAS', 'nao_autenticado');

export class Autenticar {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: AutenticarEntrada, ctx: ContextoPublico): Promise<Result<AutenticarSaida>> {
    const agora = this.d.relogio.agora();
    const email = Email.criar(e.email);
    if (email.falhou || typeof e.senha !== 'string') return Result.fail(CREDENCIAIS_INVALIDAS);

    const chaveConta = `login:conta:${email.valor.valor}`;
    const chaveIp = `login:ip:${ctx.ip}`;
    for (const chave of [chaveConta, chaveIp]) {
      const { bloqueadoAte } = await this.d.limitador.estado(chave, agora);
      if (bloqueadoAte) return Result.fail(falha('TENTATIVAS_EXCEDIDAS', 'limite_excedido', { detalhes: { bloqueadoAte: bloqueadoAte.toISOString() } }));
    }

    const usuario = await this.d.usuarios.buscarPorEmail(email.valor);
    const senhaOk = usuario
      ? await this.d.hasher.verificar(usuario.senhaHash, e.senha)
      : (await this.d.hasher.verificar(this.d.hasher.hashFicticio, e.senha), false);

    if (!usuario || !senhaOk) {
      await this.registrarFalha(chaveConta, chaveIp, usuario, ctx, agora);
      return Result.fail(CREDENCIAIS_INVALIDAS);
    }

    const disponivel = usuario.podeAutenticar();
    if (disponivel.falhou) {
      await this.d.auditoria.registrar('LOGIN_CONTA_INDISPONIVEL', { usuarioId: usuario.id.valor, ip: ctx.ip });
      return Result.fail(disponivel.falhas);
    }
    await this.d.limitador.limpar(chaveConta);

    if (!usuario.mfa.confirmado) {
      if (!this.d.config.mfaObrigatorio) return Result.ok(await this.emitirSessao(usuario, ctx));
      return Result.ok(await this.iniciarCadastroMfa(usuario, agora));
    }

    const desafio = DesafioMfa.criar({ usuarioId: usuario.id, tipo: 'VERIFICACAO', metodo: usuario.mfa.metodoPreferido }, agora);
    if (desafio.metodo === 'EMAIL') {
      const emitido = await emitirCodigoEmail(this.d, desafio, usuario, agora);
      if (emitido.falhou) return Result.fail(emitido.falhas);
    }
    await this.d.desafios.salvar(desafio);
    await this.d.auditoria.registrar('LOGIN_SENHA_OK', { usuarioId: usuario.id.valor, ip: ctx.ip, metodo: desafio.metodo });
    return Result.ok({ etapa: 'MFA_DESAFIO', desafioId: desafio.id.valor, metodo: desafio.metodo, emailMascarado: usuario.email.mascarado });
  }

  private async iniciarCadastroMfa(usuario: Usuario, agora: Date): Promise<AutenticarSaida> {
    const segredo = this.d.totp.gerarSegredo();
    usuario.iniciarCadastroMfa(await this.d.cifrador.cifrar(segredo));
    await this.d.usuarios.salvar(usuario);
    const desafio = DesafioMfa.criar({ usuarioId: usuario.id, tipo: 'CADASTRO', metodo: 'TOTP' }, agora);
    await this.d.desafios.salvar(desafio);
    return { etapa: 'MFA_CADASTRO', desafioId: desafio.id.valor, segredo, uri: this.d.totp.uri(segredo, usuario.email.valor) };
  }

  private async emitirSessao(usuario: Usuario, ctx: ContextoPublico): Promise<AutenticarSaida> {
    const token = await this.d.sessoes.criar(usuario.id, { ip: ctx.ip, userAgent: ctx.userAgent });
    await this.d.auditoria.registrar('LOGIN_SUCESSO', { usuarioId: usuario.id.valor, ip: ctx.ip, mfa: false });
    return { etapa: 'SESSAO', token };
  }

  private async registrarFalha(chaveConta: string, chaveIp: string, usuario: Usuario | null, ctx: ContextoPublico, agora: Date) {
    const bloqueouConta = await this.d.limitador.registrarFalha(chaveConta, BLOQUEIO_LOGIN_CONTA, agora);
    await this.d.limitador.registrarFalha(chaveIp, BLOQUEIO_LOGIN_IP, agora);
    await this.d.auditoria.registrar('LOGIN_FALHA', { usuarioId: usuario?.id.valor ?? null, ip: ctx.ip });
    if (bloqueouConta && usuario) {
      await this.d.email.enviar({ para: usuario.email.valor, modelo: 'CONTA_BLOQUEADA', dados: { ip: ctx.ip } });
    }
  }
}
