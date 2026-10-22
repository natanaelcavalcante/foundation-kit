import { Id } from './id';

export interface EventoDominio {
  readonly nome: string;
  readonly ocorridoEm: Date;
  readonly dados: Readonly<Record<string, unknown>>;
}

/**
 * Entidade: identidade + invariantes. Estado só muda por métodos de domínio que retornam `Result`
 * e nunca deixam a entidade inválida. Subclasses: construtor privado + `static criar()` (nova) e
 * `static restaurar()` (vinda do banco, sem revalidar regras de criação).
 */
export abstract class Entity<Props extends object> {
  private readonly _eventos: EventoDominio[] = [];

  protected constructor(
    readonly id: Id,
    protected props: Props,
  ) {}

  equals(outra: Entity<Props> | null | undefined): boolean {
    return !!outra && outra.constructor === this.constructor && outra.id.equals(this.id);
  }

  protected registrar(nome: string, dados: Record<string, unknown>, ocorridoEm: Date): void {
    this._eventos.push({ nome, dados, ocorridoEm });
  }

  /** Retorna e limpa os eventos pendentes — chamado pelo repositório/outbox após persistir. */
  extrairEventos(): EventoDominio[] {
    return this._eventos.splice(0);
  }
}
