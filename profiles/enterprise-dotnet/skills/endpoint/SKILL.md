---
name: endpoint
description: Cria ou revisa endpoints HTTP no perfil enterprise-dotnet — Minimal API fina com policy de permissão, binding sem campos de tenant/usuário, envio do command via MediatR e mapeamento Result→ProblemDetails; inclui os testes 401/403/404/422/409 com WebApplicationFactory. Usar ao expor um comando ou query.
---

# Endpoint (Minimal API)

## Template
```csharp
public static class OsEndpoints
{
    public static RouteGroupBuilder MapOs(this RouteGroupBuilder g)
    {
        g.MapPost("/{osId:guid}/iniciar", async (Guid osId, IniciarOsBody body, ISender mediator, CancellationToken ct) =>
            (await mediator.Send(new IniciarOsCommand(osId, body.MecanicoId), ct)).ParaHttp())
         .RequireAuthorization("os:iniciar")
         .RequireRateLimiting("sensivel")
         .WithName("IniciarOs");
        return g;
    }
}
public sealed record IniciarOsBody(Guid MecanicoId); // sem TenantId/UsuarioId/Status
```
- `ParaHttp()` (no Host): sucesso → 200/201 com o DTO; falha → `Results.Problem(statusCode: falha.StatusHttp, extensions: { codigo, campo, traceId })`.
- `JsonSerializerOptions.UnmappedMemberHandling = Disallow` no Host: campos extras → 400 (bloqueia mass assignment).
- Rotas públicas: só com `.AllowAnonymous()` explícito (a `FallbackPolicy` nega o resto).

## Testes (IntegrationTests com WebApplicationFactory + Testcontainers)
| Caso | Esperado |
|---|---|
| sem token | 401 |
| sem a permissão | 403 `ACESSO_NEGADO` |
| recurso de outro tenant | 404 |
| body com campos extras (`tenantId`, `status`) | 400, e o estado não muda |
| entrada inválida | 400/422 com campo |
| regra violada | 409/422 com código |
| sucesso | 200 + estado persistido |
| exceção inesperada | 500 com `traceId`, sem stack |
Use uma fábrica de tokens de teste (`TokenDeTeste.Para(usuario, tenant, permissoes)`).
