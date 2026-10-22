import { falha } from './falha';
import { Result } from './result';
import { ValueObject } from './value-object';

/** Dinheiro em centavos inteiros (nunca float). Moeda única por projeto, salvo ADR. */
export class Money extends ValueObject<number> {
  private constructor(centavos: number) {
    super(centavos);
  }

  static zero(): Money {
    return new Money(0);
  }

  static deCentavos(centavos: unknown, campo = 'valor'): Result<Money> {
    if (typeof centavos !== 'number' || !Number.isSafeInteger(centavos)) {
      return Result.fail(falha('VALOR_INVALIDO', 'validacao', { campo }));
    }
    if (centavos < 0) return Result.fail(falha('VALOR_NEGATIVO', 'validacao', { campo }));
    return Result.ok(new Money(centavos));
  }

  get centavos(): number {
    return this.valor;
  }

  somar(outro: Money): Money {
    return new Money(this.valor + outro.valor);
  }

  multiplicar(quantidade: number): Money {
    return new Money(Math.round(this.valor * quantidade));
  }

  /** Aplica percentual (0–100) arredondando meio centavo para cima. */
  percentual(p: number): Money {
    return new Money(Math.round((this.valor * p) / 100));
  }

  subtrair(outro: Money): Result<Money> {
    return outro.valor > this.valor
      ? Result.fail(falha('VALOR_NEGATIVO', 'regra_negocio'))
      : Result.ok(new Money(this.valor - outro.valor));
  }
}
