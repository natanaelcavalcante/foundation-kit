---
name: servico-dominio
description: Cria ou revisa serviços de domínio (arquivos *.service.ts em modules/*/src/dominio) no perfil web-nextjs — regras e cálculos puros que envolvem mais de uma entidade/VO e não pertencem naturalmente a nenhuma delas. Usar para políticas como cálculo de orçamento, alocação de mecânico, regras de preço.
---

# Serviço de domínio

## Quando usar (e quando não)
- **Use** quando a regra envolve vários agregados/VOs e é **pura** (por exemplo, calcular o total da OS com peças, mão de obra e descontos por política).
- **Não use** para orquestrar repositórios (isso é caso de uso) nem para regras de uma entidade só (isso é método da entidade).

## Regras
- Funções/classes **sem estado e sem I/O**. Os dados entram por parâmetro e o resultado sai como `Result`.
- Dependências, se houver, são outras políticas puras injetadas.
- Nome pelo conceito do negócio: `PoliticaDesconto`, `CalculadoraOrcamento`.

## Template — `modules/oficina/src/dominio/calculadora-orcamento.service.ts`
```ts
import { falha, Result } from '@app/kernel';
import type { Money } from '@app/kernel';

export interface ItemOrcamento { tipo: 'PECA' | 'SERVICO'; valor: Money; quantidade: number }

export class CalculadoraOrcamento {
  constructor(private readonly descontoMaximoPercentual: number) {}

  calcular(itens: readonly ItemOrcamento[], descontoPercentual: number): Result<Money> {
    if (itens.length === 0) return Result.fail(falha('ORCAMENTO_SEM_ITENS', 'regra_negocio'));
    if (descontoPercentual < 0 || descontoPercentual > this.descontoMaximoPercentual) {
      return Result.fail(falha('DESCONTO_ACIMA_DO_PERMITIDO', 'regra_negocio', { detalhes: { maximo: this.descontoMaximoPercentual } }));
    }
    // ... soma em centavos (inteiros), nunca float
  }
}
```

## Testes obrigatórios
Tabela de casos (`it.each`) com entradas e saídas esperadas calculadas à mão, limites (0, máximo exato, máximo + 1) e arredondamento.
Dinheiro sempre em centavos inteiros.
