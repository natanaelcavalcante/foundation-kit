# Padrões comuns às skills (perfil enterprise-dotnet)

## Caminhos
| Camada | Caminho | Pode depender de |
|---|---|---|
| Kernel | `src/BuildingBlocks` | nada |
| Domínio | `src/Modules/<Modulo>/<Modulo>.Domain` | BuildingBlocks |
| Aplicação | `src/Modules/<Modulo>/<Modulo>.Application` (Commands, Queries, DTOs, portas, validators) | Domain, MediatR, FluentValidation |
| Infraestrutura | `src/Modules/<Modulo>/<Modulo>.Infrastructure` (DbContext, configurações EF, repositórios, queries) | Application, EF Core |
| API | `src/Modules/<Modulo>/<Modulo>.Api` (endpoints Minimal API + registro do módulo) | Application |
| Host | `src/Host/Api` (composição, auth, rate limit, middlewares) | todos os `.Api` e `.Infrastructure` |
| Testes | `tests/<Modulo>.{UnitTests,IntegrationTests}`, `tests/ArchitectureTests` | — |
| Front | `web/src/app/features/<modulo>/` | — |

## Nomes (pt-BR por padrão)
- Classes de domínio em português: `OrdemServico`, `Placa`, `IniciarOsCommand`, `IniciarOsHandler`, `ListarOsQuery`.
- Termos técnicos consagrados em inglês: `Command`, `Handler`, `Query`, `Repository`, `DbContext`, `Validator`, `Endpoint`.
- Códigos de falha específicos em `SCREAMING_SNAKE_CASE` (`MECANICO_OCUPADO`).

## Regras que toda skill verifica
1. O Domain não referencia EF Core, ASP.NET ou MediatR (regra verificada por `teste-arquitetura`).
2. Nada de `DateTime.Now`/`UtcNow` no domínio/aplicação: use `IRelogio` (adapter de `TimeProvider`).
3. `TenantId`/`UsuarioId` vêm do `ContextoExecucao` (claims do token), nunca do corpo da requisição.
4. Cada `Scenario` da spec tem um teste `[Fact(DisplayName = "<nome do cenário>")]`.
5. Falhas esperadas → `Result.Falha(...)`; `throw` só para bugs/infra.
6. `dotnet build` com `TreatWarningsAsErrors` limpo; `dotnet test` verde; cobertura ≥ 80% (coverlet).
