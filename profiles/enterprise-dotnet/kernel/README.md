# Kernel (src/BuildingBlocks)

Primitivas transversais do perfil enterprise-dotnet, copiadas para `src/BuildingBlocks/` na Fase 3.
Mesmo desenho do kernel do web-nextjs: `Result`/`Falha` com tipo → HTTP, `Entity` com eventos, `ValueObject`, `Id`,
`Money` em centavos, `ContextoExecucao` (sempre da sessão), paginação e portas (`IRelogio`, `ICifrador`, `IGerenciadorTransacao`).

`dotnet test` → deve passar 100%.
