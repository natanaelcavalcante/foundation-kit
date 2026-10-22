/** VO imutável, igual por valor. Subclasses expõem `static criar(bruto): Result<Vo>` e construtor privado. */
export abstract class ValueObject<V> {
  protected constructor(readonly valor: V) {
    Object.freeze(this);
  }

  equals(outro: ValueObject<V> | null | undefined): boolean {
    if (!outro || outro.constructor !== this.constructor) return false;
    return JSON.stringify(this.valor) === JSON.stringify(outro.valor);
  }

  toJSON(): V {
    return this.valor;
  }
}
