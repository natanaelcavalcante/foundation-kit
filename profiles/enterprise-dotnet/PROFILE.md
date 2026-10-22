# Perfil: enterprise-dotnet

**Quando:** sistemas corporativos, segurança reforçada (ASVS L3), SSO, auditoria pesada, integrações legadas, equipes maiores.

## Stack
| Camada | Escolha |
|---|---|
| Backend | **.NET 10 LTS (ASP.NET Core, Minimal API)**, Clean Architecture, **MediatR** (CQRS — atenção: v13+ tem licença comercial; alternativas MIT: `Mediator` de martinothamar com source generator, ou interfaces de handler próprias, decidido por ADR), **FluentValidation** |
| ORM | **Entity Framework Core** (escrita) + **Dapper** opcional para queries de leitura pesadas (ADR) |
| Banco | **PostgreSQL 16** (padrão) ou **SQL Server** (exigência do cliente: Always Encrypted + RLS) |
| Auth | **ASP.NET Core Identity** (Argon2id, lockout progressivo, TOTP cifrado, código por e-mail — skill `identity-aspnet`) + **OpenIddict** (OIDC/JWT) ; SSO corporativo via OIDC/SAML (Entra ID) |
| Autorização | Policies + requirements por permissão; filtro global de tenant no `DbContext` (Global Query Filters) + RLS |
| Criptografia | **ASP.NET Data Protection** (chaves persistidas e cifradas) + AES-GCM para campos (`System.Security.Cryptography.AesGcm`), chave mestra em Vault/Azure Key Vault |
| Cache/filas/rate limit | **Redis** + `Microsoft.AspNetCore.RateLimiting`; jobs com **Hangfire** ou **MassTransit + RabbitMQ** (ADR) |
| Frontend | **Angular 18+** (standalone, signals), **Angular Material** ou PrimeNG, `@ngx-translate`/i18n nativo |
| Arquivos | Cloudflare R2 / S3; dev: MinIO |
| Observabilidade | **Serilog** (JSON + redator de PII), **OpenTelemetry**, health checks nativos |
| Proxy/borda | Nginx ou YARP + Cloudflare |
| Testes | **xUnit** (Assert nativo ou Shouldly — evite FluentAssertions ≥ 8, licença comercial), **NSubstitute**, **Testcontainers**, `WebApplicationFactory` (integração HTTP), **Stryker.NET**, **Playwright** (E2E), **Jest/Karma** no Angular; **NetArchTest** para garantir a regra de dependência entre camadas |
| Qualidade | `dotnet format`, analyzers com `TreatWarningsAsErrors`, SonarAnalyzer, `dotnet list package --vulnerable`, gitleaks |

## Estrutura
```
/
├── src/
│   ├── BuildingBlocks/            # Kernel: Result, Entity, ValueObject, erros, Cifrador (porta)
│   ├── Modules/<Modulo>/
│   │   ├── <Modulo>.Domain/        # sem dependência de framework
│   │   ├── <Modulo>.Application/   # Commands/Queries (MediatR), DTOs, portas, validators
│   │   ├── <Modulo>.Infrastructure/# EF Core config, repositórios, adapters
│   │   └── <Modulo>.Api/           # endpoints (Minimal API ou Controllers)
│   └── Host/Api/                  # composição, middlewares, auth, rate limit
├── tests/<Modulo>.{Unit,Integration,Architecture}Tests/
├── web/                           # Angular: core/, shared/, features/<modulo>/
├── docker-compose.yml             # api, web, postgres, redis, minio, mailpit, (rabbitmq)
├── openspec/ docs/ .foundation/
```
Monólito modular: cada módulo tem seu `DbContext`/schema; a comunicação entre módulos acontece por contratos públicos ou eventos de integração (outbox).

## Comandos padrão
`docker compose up -d` · `dotnet test /p:CollectCoverage=true` · `dotnet stryker` · `npm --prefix web test` · `npx playwright test`
