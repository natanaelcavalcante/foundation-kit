import { describe, expect, it } from 'vitest';
import { Money } from '../src';

const m = (c: number) => Money.deCentavos(c).valor;

describe('Money', () => {
  it('cria a partir de centavos inteiros', () => {
    expect(m(1050).centavos).toBe(1050);
    expect(Money.zero().centavos).toBe(0);
  });

  it.each([[10.5], ['10'], [Number.MAX_SAFE_INTEGER + 1], [NaN]])('recusa %s', (v) => {
    expect(Money.deCentavos(v).falhas[0]).toMatchObject({ codigo: 'VALOR_INVALIDO', campo: 'valor' });
  });

  it('recusa negativo', () => expect(Money.deCentavos(-1).codigos).toEqual(['VALOR_NEGATIVO']));

  it('opera sem perder centavos', () => {
    expect(m(100).somar(m(1)).centavos).toBe(101);
    expect(m(333).multiplicar(3).centavos).toBe(999);
    expect(m(1005).percentual(10).centavos).toBe(101);
    expect(m(100).subtrair(m(40)).valor.centavos).toBe(60);
    expect(m(100).subtrair(m(101)).codigos).toEqual(['VALOR_NEGATIVO']);
  });
});
