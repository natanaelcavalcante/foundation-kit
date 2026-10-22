import type { Falha } from './falha';

/** Resultado de operações que podem falhar de forma esperada. Exceções ficam para o inesperado. */
export class Result<T> {
  private constructor(
    private readonly _valor: T | undefined,
    readonly falhas: readonly Falha[],
  ) {}

  static ok<T>(valor: T): Result<T>;
  static ok(): Result<void>;
  static ok<T>(valor?: T): Result<T> {
    return new Result<T>(valor as T, []);
  }

  static fail<T = never>(falha: Falha | readonly Falha[]): Result<T> {
    const falhas = Array.isArray(falha) ? falha : [falha as Falha];
    if (falhas.length === 0) throw new Error('Result.fail exige ao menos uma falha');
    return new Result<T>(undefined, falhas);
  }

  /** Agrega todas as falhas (útil para validar vários VOs de uma vez). */
  static combine<const R extends readonly Result<unknown>[]>(
    resultados: R,
  ): Result<{ [K in keyof R]: R[K] extends Result<infer V> ? V : never }> {
    const falhas = resultados.flatMap((r) => r.falhas);
    if (falhas.length > 0) return Result.fail(falhas);
    return Result.ok(resultados.map((r) => r._valor) as never);
  }

  get ok(): boolean {
    return this.falhas.length === 0;
  }

  get falhou(): boolean {
    return !this.ok;
  }

  /** Valor do sucesso. Lança se chamado em uma falha — sempre cheque `ok` antes. */
  get valor(): T {
    if (this.falhou) throw new Error(`Acesso a valor de Result com falha: ${this.codigos.join(', ')}`);
    return this._valor as T;
  }

  get codigos(): string[] {
    return this.falhas.map((f) => f.codigo);
  }

  map<U>(fn: (valor: T) => U): Result<U> {
    return this.ok ? Result.ok(fn(this._valor as T)) : Result.fail(this.falhas);
  }

  andThen<U>(fn: (valor: T) => Result<U>): Result<U> {
    return this.ok ? fn(this._valor as T) : Result.fail(this.falhas);
  }
}
