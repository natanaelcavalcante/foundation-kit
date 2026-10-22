---
name: value-object
description: Cria ou revisa Value Objects (arquivos *.vo.ts) no perfil web-nextjs — tipos imutáveis que se validam e normalizam na criação (Placa, Email, CPF, Money, Justificativa). Usar quando um atributo de domínio tiver regra de formato, faixa ou normalização.
---

# Value Object

## Regras
- Estenda `ValueObject<V>` de `@app/kernel`. Construtor **privado**, `static criar(bruto: unknown, campo?): Result<Vo>`.
- Receba `unknown` (VOs ficam na fronteira) e valide o tipo, depois as regras.
- Normalize antes de guardar (trim, maiúsculas, só dígitos). O valor armazenado é sempre o canônico.
- Uma falha por regra violada, com código específico e `campo`.
- Sem I/O e sem dependências. Se a regra precisa consultar o banco (unicidade), ela é do caso de uso, não do VO.
- Antes de criar, procure se o VO já existe em `packages/kernel` ou em outro módulo. Se for transversal (Email, CPF, Money), ele vai para o kernel.

## Template — `modules/oficina/src/dominio/placa.vo.ts`
```ts
import { falha, Result, ValueObject } from '@app/kernel';

const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
const ANTIGA = /^[A-Z]{3}\d{4}$/;

export class Placa extends ValueObject<string> {
  private constructor(valor: string) {
    super(valor);
  }

  static criar(bruto: unknown, campo = 'placa'): Result<Placa> {
    if (typeof bruto !== 'string') return Result.fail(falha('PLACA_OBRIGATORIA', 'validacao', { campo }));
    const normalizada = bruto.replace(/[\s-]/g, '').toUpperCase();
    if (!MERCOSUL.test(normalizada) && !ANTIGA.test(normalizada)) {
      return Result.fail(falha('PLACA_INVALIDA', 'validacao', { campo }));
    }
    return Result.ok(new Placa(normalizada));
  }

  get mercosul(): boolean {
    return MERCOSUL.test(this.valor);
  }
}
```

## Testes obrigatórios — `test/dominio/placa.vo.test.ts`
```ts
describe('Placa', () => {
  it.each(['ABC1D23', 'abc-1d23', ' ABC1234 '])('aceita e normaliza %s', (v) => {
    expect(Placa.criar(v).valor.valor).toMatch(/^[A-Z0-9]{7}$/);
  });
  it.each(['', 'AB1234', 'ABCD123', 'ABC12345'])('recusa %s', (v) => {
    expect(Placa.criar(v).codigos).toEqual(['PLACA_INVALIDA']);
  });
  it('recusa não-string', () => expect(Placa.criar(null).codigos).toEqual(['PLACA_OBRIGATORIA']));
  it('igualdade por valor normalizado', () => expect(Placa.criar('abc1d23').valor.equals(Placa.criar('ABC-1D23').valor)).toBe(true));
});
```
Cubra: válidos (incluindo variações de formatação), cada regra inválida, limites (tamanho mínimo/máximo exatos), tipo errado e igualdade.
