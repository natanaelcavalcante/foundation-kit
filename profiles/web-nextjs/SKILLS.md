# Skills do perfil web-nextjs

Prontas em `profiles/web-nextjs/skills/`. Na Fase 3, a skill `config-projeto` as copia para `.claude/skills/`
(para Cursor/Codex, o `AGENTS.md` aponta para a mesma pasta). Padrões comuns em `skills/_padroes/PADROES.md`.
O kernel testado (Result, Falha, Entity, ValueObject, Id, Money, ContextoExecucao, Pagina, portas) fica em `profiles/web-nextjs/kernel/`.

| Skill | Quando |
|---|---|
| `config-projeto` | Fase 3, passo 1: scaffold, Docker, CI |
| `novo-modulo` | Início de cada módulo (exige spec aprovada) |
| `value-object` | Atributo com regra de formato/faixa |
| `entidade` | Conceito com identidade e ciclo de vida |
| `servico-dominio` | Regra pura entre várias entidades |
| `caso-de-uso` | Cada intenção do usuário |
| `repositorio` | Persistir agregado (porta + Prisma + constraints + RLS) |
| `query-cqrs` | Listagens, buscas, relatórios |
| `rota-api` | Expor caso de uso (Route Handler / Server Action) |
| `form` | UI do caso de uso |
| `campo-sensivel` | Dado pessoal/sensível |
| `teste-seguranca` | Suíte de autorização e burla do módulo (antes da DoD) |
| `teste-regressao` | Toda correção de bug |
