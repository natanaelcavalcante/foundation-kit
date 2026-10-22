---
name: query-cqrs
description: Cria ou revisa queries de leitura CQRS no perfil web-nextjs — porta *.query.ts no módulo, adapter Prisma otimizado, DTO de saída, paginação, filtros, ordenação por allowlist e isolamento de tenant. Usar para listagens, buscas, detalhes de tela e relatórios.
---

# Query (leitura)

## Regras
- Leitura **não** passa por entidade: a query retorna DTO direto (projeção com `select`).
- Porta no módulo (`aplicacao/listar-os.query.ts`), adapter em `packages/infra`. O caso de uso de leitura aplica a permissão e chama a query.
- **Sempre** filtre por `ctx.tenantId`. Recursos de outro usuário seguem a regra da spec (por exemplo, o mecânico vê só as próprias OSs).
- Paginação com `normalizarPagina` (limite máximo de 100). Retorne `Pagina<T>`.
- Ordenação e filtros por **allowlist** (`ORDENAVEIS = ['criadaEm','status'] as const`). Nunca repasse um campo vindo do cliente direto para o `orderBy`.
- Busca textual: `contains` + `mode: 'insensitive'`, ou `pg_trgm` quando houver volume. Campos cifrados só aceitam busca exata via blind index.
- O DTO expõe só o que a tela precisa: nada de `tenantId`, hash, campos internos, PII além do necessário.

## Template
```ts
// modules/oficina/src/aplicacao/listar-os.query.ts
export interface ListarOsFiltro { status?: StatusOs; placa?: string; ordenarPor?: (typeof ORDENAVEIS)[number]; direcao?: 'asc' | 'desc' }
export const ORDENAVEIS = ['criadaEm', 'status'] as const;
export interface ListarOsQuery {
  executar(f: ListarOsFiltro, p: PaginaEntrada, escopo: { tenantId: string; somenteMecanicoId?: string }): Promise<Pagina<OsResumoDTO>>;
}
```
```ts
// packages/infra/src/oficina/listar-os.prisma.ts
const where = { tenantId: escopo.tenantId, ...(f.status && { status: f.status }), ...(escopo.somenteMecanicoId && { mecanicoId: escopo.somenteMecanicoId }) };
const [itens, total] = await this.db.$transaction([
  this.db.ordemServico.findMany({ where, select: { id: true, status: true, criadaEm: true, veiculo: { select: { placa: true } } },
    orderBy: { [f.ordenarPor ?? 'criadaEm']: f.direcao ?? 'desc' }, skip: (p.pagina - 1) * p.tamanho, take: p.tamanho }),
  this.db.ordemServico.count({ where }),
]);
```

## Testes de integração obrigatórios
Filtros isolados e combinados; paginação (primeira, última, além do fim); ordenação; **dados de outro tenant nunca aparecem**;
escopo restrito (o mecânico não vê OSs de outro); o DTO não contém campos proibidos (`expect(Object.keys(item)).toEqual([...])`).
