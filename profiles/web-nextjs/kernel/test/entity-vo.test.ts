import { describe, expect, it } from 'vitest';
import { Entity, exigirPermissao, Id, normalizarPagina, ValueObject, type ContextoExecucao } from '../src';

class Cor extends ValueObject<string> {
  static de(v: string) {
    return new Cor(v);
  }
}
class Tamanho extends ValueObject<string> {
  static de(v: string) {
    return new Tamanho(v);
  }
}
class Coisa extends Entity<{ nome: string }> {
  static de(id: Id) {
    return new Coisa(id, { nome: 'a' });
  }
  renomear(nome: string, em: Date) {
    this.props.nome = nome;
    this.registrar('CoisaRenomeada', { nome }, em);
  }
}
class Outra extends Entity<{ nome: string }> {
  static de(id: Id) {
    return new Outra(id, { nome: 'a' });
  }
}

describe('Id', () => {
  it('gera uuid válido e normaliza para minúsculas', () => {
    const id = Id.novo();
    expect(Id.criar(id.valor).ok).toBe(true);
    expect(Id.criar(id.valor.toUpperCase()).valor.valor).toBe(id.valor);
  });

  it('recusa valores inválidos informando o campo', () => {
    const r = Id.criar('abc', 'osId');
    expect(r.falhas[0]).toMatchObject({ codigo: 'ID_INVALIDO', campo: 'osId' });
    expect(Id.criar(42).ok).toBe(false);
  });
});

describe('ValueObject', () => {
  it('é imutável e igual por valor e tipo', () => {
    const a = Cor.de('azul');
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.equals(Cor.de('azul'))).toBe(true);
    expect(a.equals(Cor.de('verde'))).toBe(false);
    expect(a.equals(Tamanho.de('azul') as never)).toBe(false);
    expect(a.equals(null)).toBe(false);
    expect(a.toJSON()).toBe('azul');
  });
});

describe('Entity', () => {
  it('é igual por id e tipo', () => {
    const id = Id.novo();
    expect(Coisa.de(id).equals(Coisa.de(id))).toBe(true);
    expect(Coisa.de(id).equals(Coisa.de(Id.novo()))).toBe(false);
    expect(Coisa.de(id).equals(Outra.de(id) as never)).toBe(false);
    expect(Coisa.de(id).equals(undefined)).toBe(false);
  });

  it('acumula e extrai eventos uma única vez', () => {
    const c = Coisa.de(Id.novo());
    const em = new Date('2026-01-01');
    c.renomear('b', em);
    expect(c.extrairEventos()).toEqual([{ nome: 'CoisaRenomeada', dados: { nome: 'b' }, ocorridoEm: em }]);
    expect(c.extrairEventos()).toEqual([]);
  });
});

describe('contexto e paginação', () => {
  const ctx: ContextoExecucao = { usuarioId: 'u', tenantId: 't', permissoes: new Set(['os:iniciar']), traceId: 'x' };

  it('exigirPermissao', () => {
    expect(exigirPermissao(ctx, 'os:iniciar').ok).toBe(true);
    expect(exigirPermissao(ctx, 'os:excluir').falhas[0]).toMatchObject({ codigo: 'ACESSO_NEGADO', tipo: 'proibido' });
  });

  it('normalizarPagina limita valores', () => {
    expect(normalizarPagina()).toEqual({ pagina: 1, tamanho: 20 });
    expect(normalizarPagina({ pagina: -3, tamanho: 9999 })).toEqual({ pagina: 1, tamanho: 100 });
    expect(normalizarPagina({ pagina: 2.7, tamanho: 0 })).toEqual({ pagina: 2, tamanho: 1 });
  });
});
