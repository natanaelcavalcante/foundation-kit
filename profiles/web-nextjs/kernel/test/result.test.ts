import { describe, expect, it } from 'vitest';
import { falha, HTTP_POR_TIPO, Result } from '../src';

const F = falha('X', 'validacao');

describe('Result', () => {
  it('ok expõe valor e não tem falhas', () => {
    const r = Result.ok(1);
    expect(r.ok).toBe(true);
    expect(r.falhou).toBe(false);
    expect(r.valor).toBe(1);
    expect(r.codigos).toEqual([]);
  });

  it('ok sem argumento retorna void', () => {
    expect(Result.ok().ok).toBe(true);
  });

  it('fail guarda falhas e acesso ao valor lança', () => {
    const r = Result.fail(F);
    expect(r.falhou).toBe(true);
    expect(r.codigos).toEqual(['X']);
    expect(() => r.valor).toThrow(/X/);
  });

  it('fail aceita lista e recusa lista vazia', () => {
    expect(Result.fail([F, falha('Y', 'conflito')]).codigos).toEqual(['X', 'Y']);
    expect(() => Result.fail([])).toThrow();
  });

  it('combine agrega todas as falhas', () => {
    const r = Result.combine([Result.ok(1), Result.fail(F), Result.fail(falha('Y', 'validacao'))]);
    expect(r.codigos).toEqual(['X', 'Y']);
  });

  it('combine retorna tupla de valores no sucesso', () => {
    expect(Result.combine([Result.ok(1), Result.ok('a')]).valor).toEqual([1, 'a']);
  });

  it('map e andThen propagam sucesso e curto-circuitam falha', () => {
    expect(Result.ok(2).map((v) => v * 2).valor).toBe(4);
    expect(Result.ok(2).andThen((v) => Result.ok(v + 1)).valor).toBe(3);
    expect(Result.fail<number>(F).map((v) => v * 2).codigos).toEqual(['X']);
    expect(Result.fail<number>(F).andThen((v) => Result.ok(v)).codigos).toEqual(['X']);
  });

  it('falha aceita campo e mapeia tipo para HTTP', () => {
    expect(falha('A', 'nao_encontrado', { campo: 'id' })).toEqual({ codigo: 'A', tipo: 'nao_encontrado', campo: 'id' });
    expect(HTTP_POR_TIPO.nao_encontrado).toBe(404);
    expect(HTTP_POR_TIPO.limite_excedido).toBe(429);
  });
});
