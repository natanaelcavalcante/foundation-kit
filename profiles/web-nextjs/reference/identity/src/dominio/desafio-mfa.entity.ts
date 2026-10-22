import { Entity, falha, Id, Result } from '@app/kernel';
import type { MetodoMfa } from './usuario.entity';

export type TipoDesafio = 'CADASTRO' | 'VERIFICACAO';

export const DESAFIO_VALIDADE_MS = 10 * 60_000;
export const CODIGO_EMAIL_VALIDADE_MS = 10 * 60_000;
export const CODIGO_EMAIL_INTERVALO_MS = 60_000;
export const DESAFIO_MAX_TENTATIVAS = 5;

interface Props {
  usuarioId: Id;
  tipo: TipoDesafio;
  metodo: MetodoMfa;
  expiraEm: Date;
  tentativasFalhas: number;
  codigoEmailHash: string | null;
  codigoEmailExpiraEm: Date | null;
  codigoEmailEnviadoEm: Date | null;
}

/**
 * Etapa intermediária do login: senha correta, sessão ainda NÃO emitida.
 * Equivale ao `two_factor_pending_user_id` do NexusCMS, mas com validade, limite de tentativas
 * e guardado no servidor (Redis), nunca em estado do cliente.
 */
export class DesafioMfa extends Entity<Props> {
  private constructor(id: Id, props: Props) {
    super(id, props);
  }

  static criar(e: { usuarioId: Id; tipo: TipoDesafio; metodo: MetodoMfa }, agora: Date): DesafioMfa {
    return new DesafioMfa(Id.novo(), {
      ...e,
      expiraEm: new Date(agora.getTime() + DESAFIO_VALIDADE_MS),
      tentativasFalhas: 0,
      codigoEmailHash: null,
      codigoEmailExpiraEm: null,
      codigoEmailEnviadoEm: null,
    });
  }

  static restaurar(p: Props & { id: Id }): DesafioMfa {
    const { id, ...props } = p;
    return new DesafioMfa(id, props);
  }

  get usuarioId() { return this.props.usuarioId; }
  get tipo() { return this.props.tipo; }
  get metodo() { return this.props.metodo; }
  get expiraEm() { return this.props.expiraEm; }
  get tentativasFalhas() { return this.props.tentativasFalhas; }
  get codigoEmailHash() { return this.props.codigoEmailHash; }
  get codigoEmailExpiraEm() { return this.props.codigoEmailExpiraEm; }
  get codigoEmailEnviadoEm() { return this.props.codigoEmailEnviadoEm; }

  validoPara(tipo: TipoDesafio, agora: Date): Result<void> {
    if (this.props.tipo !== tipo || agora >= this.props.expiraEm || this.esgotado) {
      return Result.fail(falha('DESAFIO_INVALIDO', 'nao_autenticado'));
    }
    return Result.ok();
  }

  get esgotado(): boolean {
    return this.props.tentativasFalhas >= DESAFIO_MAX_TENTATIVAS;
  }

  registrarFalha(): void {
    this.props.tentativasFalhas += 1;
  }

  emitirCodigoEmail(hash: string, agora: Date): Result<void> {
    if (this.props.tipo !== 'VERIFICACAO') return Result.fail(falha('DESAFIO_INVALIDO', 'nao_autenticado'));
    const enviado = this.props.codigoEmailEnviadoEm;
    if (enviado && agora.getTime() - enviado.getTime() < CODIGO_EMAIL_INTERVALO_MS) {
      return Result.fail(falha('CODIGO_REENVIO_MUITO_CEDO', 'limite_excedido'));
    }
    this.props.metodo = 'EMAIL';
    this.props.codigoEmailHash = hash;
    this.props.codigoEmailEnviadoEm = agora;
    this.props.codigoEmailExpiraEm = new Date(agora.getTime() + CODIGO_EMAIL_VALIDADE_MS);
    return Result.ok();
  }

  /** Comparação feita por igualdade de HMAC (o hash já é de tamanho fixo; não há vazamento por tempo relevante). */
  verificarCodigoEmail(hash: string, agora: Date): Result<void> {
    const expira = this.props.codigoEmailExpiraEm;
    if (!this.props.codigoEmailHash || !expira || agora >= expira || hash !== this.props.codigoEmailHash) {
      return Result.fail(falha('CODIGO_INVALIDO', 'nao_autenticado'));
    }
    this.props.codigoEmailHash = null;
    return Result.ok();
  }
}
