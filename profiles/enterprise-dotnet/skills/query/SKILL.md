---
name: query
description: Cria ou revisa queries de leitura CQRS no perfil enterprise-dotnet — Query + Handler (MediatR) que projeta direto para DTO com EF Core (AsNoTracking/Select) ou Dapper, filtro de tenant, paginação, ordenação por allowlist. Usar para listagens, detalhes e relatórios.
---

# Query (leitura)

## Regras
- Sem entidade: `db.OrdensServico.AsNoTracking().Where(o => o.TenantId == ctx.TenantId)...Select(o => new OsResumoDto(...))`.
- O **Global Query Filter** de tenant no DbContext é a primeira barreira, e o `Where` explícito no handler é a segunda (e documenta a intenção). O RLS do Postgres é a terceira.
- `PaginaEntrada.Normalizar(...)`, `Skip(p.Pular).Take(p.Tamanho)`, `CountAsync` com o mesmo filtro.
- Ordenação por allowlist: `switch (q.OrdenarPor) { "criadaEm" => ..., "status" => ..., _ => padrão }`. Nunca use `OrderBy` dinâmico por string do cliente.
- Dapper só para relatórios pesados (com ADR), sempre parametrizado e com `tenant_id = @TenantId`.
- O DTO não expõe `TenantId`, hashes nem PII além do necessário.

## Testes (IntegrationTests, Testcontainers Postgres)
Filtros, paginação nos limites, ordenação, **dados de outro tenant nunca aparecem** (inclusive desligando o filtro global: `IgnoreQueryFilters` só é permitido com ADR), escopo restrito do usuário e campos do DTO.
