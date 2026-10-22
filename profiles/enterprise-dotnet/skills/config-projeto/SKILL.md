---
name: config-projeto
description: Faz o scaffold inicial (Fase 3, passo 1) de um projeto no perfil enterprise-dotnet — solução .NET 10 em monólito modular, BuildingBlocks, Host com auth/rate limit/headers, Angular, Docker Compose (Postgres, Redis, MinIO, Mailpit, Nginx), testes (xUnit, Testcontainers, NetArchTest, Stryker.NET, Playwright) e CI. Idempotente. Usar ao iniciar a fundação ou reconciliar um projeto .NET existente com o perfil.
---

# Scaffold do projeto (enterprise-dotnet)

Idempotente: nunca sobrescreva um arquivo existente sem mostrar o diff e perguntar.

## Passos
1. `dotnet new sln -n <Nome> --format slnx`; `Directory.Build.props` (net10.0, Nullable, TreatWarningsAsErrors, analyzers) e `Directory.Packages.props` (versões centralizadas).
2. Copie `.foundation/profiles/enterprise-dotnet/kernel/src/BuildingBlocks` e os testes; rode `dotnet test` (deve passar).
3. `src/Host/Api` (`dotnet new web`):
   - Serilog JSON com enricher de traceId e destructuring que mascara PII (`[REDACTED]`);
   - `ProblemDetails` global: `Falha` → status por `Falha.StatusHttp`, `codigo` na extensão; 500 sem stack, com `traceId`;
   - autenticação (ver skill `identity-aspnet`), `AddAuthorization` com `FallbackPolicy = RequireAuthenticatedUser()` (negar por padrão);
   - `AddRateLimiter` com políticas `login`, `sensivel` e `global` (particionadas por IP **e** por conta);
   - headers de segurança (HSTS, CSP, nosniff, frame-ancestors) e `ForwardedHeaders` só de proxies conhecidos;
   - health checks `/health/live` e `/health/ready` (Postgres, Redis);
   - `ContextoExecucao` montado a partir das claims por um `IContextoAccessor` (scoped).
4. `tests/ArchitectureTests` com NetArchTest (skill `teste-arquitetura`).
5. `web/`: `ng new web --standalone --routing --style=scss --ssr=false`, Angular Material, `@ngx-translate/core` (pt-BR padrão), interceptor HTTP de erro (`codigo` → mensagem i18n) e interceptor de credenciais (cookie).
6. Copie `assets/`: `docker-compose.yml`, `docker/nginx.conf`, `docker/api.Dockerfile`, `docker/web.Dockerfile`. O CI segue o mesmo desenho do web-nextjs (lint → build → unit+coverage → integração → segurança → E2E), com `dotnet format --verify-no-changes`, `dotnet list package --vulnerable` e gitleaks.
7. Copie as skills do perfil para `.claude/skills/`.
8. Verifique: `docker compose up -d && dotnet build && dotnet test && npm --prefix web test -- --watch=false`.

## Pacotes base (Directory.Packages.props)
MediatR, FluentValidation.DependencyInjectionExtensions, Microsoft.EntityFrameworkCore, Npgsql.EntityFrameworkCore.PostgreSQL,
Microsoft.AspNetCore.Identity.EntityFrameworkCore, StackExchange.Redis, Serilog.AspNetCore, OpenTelemetry.Extensions.Hosting,
MailKit (SMTP); testes: xunit, Testcontainers.PostgreSql, Testcontainers.Redis, Microsoft.AspNetCore.Mvc.Testing, NSubstitute, NetArchTest.Rules, coverlet.collector.
Evite FluentAssertions ≥ 8 (licença comercial); use `Assert` do xUnit ou Shouldly.
