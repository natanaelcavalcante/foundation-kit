import { Entity, falha, Id, Result } from '@app/kernel';
import type { Email } from './email.vo';

export type StatusUsuario = 'PENDENTE_VERIFICACAO' | 'ATIVO' | 'BLOQUEADO' | 'DESATIVADO';
export type MetodoMfa = 'TOTP' | 'EMAIL';

export interface MfaUsuario {
  /** Segredo TOTP cifrado pelo `Cifrador` (nunca em claro no banco). */
  segredoCifrado: string | null;
  confirmado: boolean;
  metodoPreferido: MetodoMfa;
  /** Último passo TOTP aceito: impede reutilizar o mesmo código dentro da janela. */
  ultimoPassoTotp: number | null;
}

interface Props {
  email: Email;
  nome: string;
  senhaHash: string;
  status: StatusUsuario;
  mfa: MfaUsuario;
  /** Hashes (HMAC) dos códigos de recuperação ainda não usados. */
  codigosRecuperacao: string[];
}

export class Usuario extends Entity<Props> {
  private constructor(id: Id, props: Props) {
    super(id, props);
  }

  static restaurar(p: Props & { id: Id }): Usuario {
    const { id, ...props } = p;
    return new Usuario(id, props);
  }

  get email() { return this.props.email; }
  get nome() { return this.props.nome; }
  get senhaHash() { return this.props.senhaHash; }
  get status() { return this.props.status; }
  get mfa(): Readonly<MfaUsuario> { return this.props.mfa; }
  get codigosRecuperacaoRestantes() { return this.props.codigosRecuperacao.length; }
  /** Para persistência: são HMACs, nunca os códigos em claro. */
  get hashesCodigosRecuperacao(): readonly string[] { return this.props.codigosRecuperacao; }

  podeAutenticar(): Result<void> {
    return this.props.status === 'ATIVO' ? Result.ok() : Result.fail(falha('CONTA_INDISPONIVEL', 'proibido'));
  }

  /** Primeiro login: gera/renova o segredo enquanto o cadastro não for confirmado (fluxo NexusCMS). */
  iniciarCadastroMfa(segredoCifrado: string): Result<void> {
    if (this.props.mfa.confirmado) return Result.fail(falha('MFA_JA_CONFIGURADO', 'conflito'));
    this.props.mfa = { ...this.props.mfa, segredoCifrado, ultimoPassoTotp: null };
    return Result.ok();
  }

  confirmarMfa(hashesRecuperacao: string[], agora: Date): Result<void> {
    if (this.props.mfa.confirmado) return Result.fail(falha('MFA_JA_CONFIGURADO', 'conflito'));
    if (!this.props.mfa.segredoCifrado) return Result.fail(falha('MFA_NAO_INICIADO', 'regra_negocio'));
    this.props.mfa = { ...this.props.mfa, confirmado: true, metodoPreferido: 'TOTP' };
    this.props.codigosRecuperacao = [...hashesRecuperacao];
    this.registrar('MfaAtivado', { usuarioId: this.id.valor }, agora);
    return Result.ok();
  }

  registrarPassoTotp(passo: number): Result<void> {
    const ultimo = this.props.mfa.ultimoPassoTotp;
    if (ultimo !== null && passo <= ultimo) return Result.fail(falha('TOTP_REUTILIZADO', 'regra_negocio'));
    this.props.mfa = { ...this.props.mfa, ultimoPassoTotp: passo };
    return Result.ok();
  }

  consumirCodigoRecuperacao(hash: string, agora: Date): Result<void> {
    const i = this.props.codigosRecuperacao.indexOf(hash);
    if (i < 0) return Result.fail(falha('CODIGO_INVALIDO', 'nao_autenticado'));
    this.props.codigosRecuperacao.splice(i, 1);
    this.registrar('CodigoRecuperacaoUsado', { usuarioId: this.id.valor, restantes: this.props.codigosRecuperacao.length }, agora);
    return Result.ok();
  }

  definirMetodoPreferido(metodo: MetodoMfa): Result<void> {
    if (metodo === 'TOTP' && !this.props.mfa.confirmado) return Result.fail(falha('MFA_NAO_INICIADO', 'regra_negocio'));
    this.props.mfa = { ...this.props.mfa, metodoPreferido: metodo };
    return Result.ok();
  }

  trocarSenha(novoHash: string, agora: Date): void {
    this.props.senhaHash = novoHash;
    this.registrar('SenhaAlterada', { usuarioId: this.id.valor }, agora);
  }
}
