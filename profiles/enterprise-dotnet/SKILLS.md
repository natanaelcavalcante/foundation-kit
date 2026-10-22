# Skills do perfil enterprise-dotnet

Prontas em `profiles/enterprise-dotnet/skills/` (copiadas para `.claude/skills/` pela `config-projeto`). Padrões em `skills/_padroes/PADROES.md`.
Kernel testado (18 testes xUnit, .NET 10) em `profiles/enterprise-dotnet/kernel/`.

| Skill | Quando |
|---|---|
| `config-projeto` | Fase 3, passo 1: solução, Host, Angular, Docker, CI |
| `identity-aspnet` | Fase 3: módulo identity sobre ASP.NET Core Identity (fluxo de referência do NexusCMS) |
| `novo-modulo` | Início de cada módulo (exige spec aprovada) |
| `value-object` / `entidade` | Domínio |
| `comando` / `query` | Casos de uso de escrita / leitura (MediatR) |
| `repositorio-ef` | Persistência, índices de regra, RLS, outbox |
| `endpoint` | Minimal API + testes HTTP |
| `feature-angular` | UI do módulo |
| `campo-sensivel` | Dado pessoal/sensível |
| `teste-arquitetura` | Regras de dependência (NetArchTest) |
| `teste-seguranca` | Autorização e burla (antes da DoD) |
| `teste-regressao` | Toda correção de bug |
