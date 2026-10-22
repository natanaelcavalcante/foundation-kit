---
name: novo-modulo
description: Cria o scaffold de um novo módulo de domínio no perfil web-nextjs (pacote modules/<m>, adapters em packages/infra, rotas/UI em apps/web, schema Prisma) a partir de uma spec OpenSpec aprovada. Usar quando o pedido for "criar módulo", "novo módulo", "iniciar módulo X" ou ao começar um módulo na Fase 4.
---

# Novo módulo

**Pré-condição:** `.foundation/state.json → modules.<m>.spec_approved_at` preenchido. Se não estiver, PARE e peça a aprovação da spec.

## Passos
1. Leia a spec (`openspec/changes/<m>/`) e `../_padroes/PADROES.md`.
2. Crie a estrutura:
```
modules/<m>/
├── package.json        # name: @app/<m>, deps: @app/kernel (workspace)
├── tsconfig.json       # extends ../../tsconfig.base.json
├── vitest.config.ts    # coverage thresholds: lines 80, branches 80 (domínio: 95)
├── src/
│   ├── dominio/        # entidades, VOs, serviços de domínio
│   ├── aplicacao/      # casos de uso, portas (repository/query), DTOs
│   └── index.ts        # exporta SÓ a API pública (casos de uso, DTOs, portas)
└── test/{dominio,aplicacao}/ + test/fakes/   # repositórios em memória
packages/infra/src/<m>/                  # adapters Prisma e outros
prisma/schema/<m>.prisma
apps/web/src/modules/<m>/{components,schemas,server}/
apps/web/src/app/(private)/<rota>/page.tsx
```
3. Registre o pacote nos workspaces raiz e no `tsconfig.base.json → paths`.
4. Adicione as permissões do módulo (`<recurso>:<acao>`) ao seed de permissões do `access-governance`.
5. Crie as tasks em `openspec/changes/<m>/tasks.md`: dominio → aplicacao → infra → rotas → UI → E2E.
6. Siga a ordem TDD com as skills: `value-object` → `entidade` → `servico-dominio` → `caso-de-uso` → `repositorio`/`query-cqrs` → `rota-api` → `form` → `campo-sensivel` (se houver PII).
7. Atualize `state.json → modules.<m>.status = "em_construcao"`.

## Checklist
- [ ] `modules/<m>` compila sem depender de Next/Prisma (`npm run typecheck -w @app/<m>`).
- [ ] O `index.ts` não exporta entidades mutáveis para a UI, só DTOs.
- [ ] Nenhum import de outro módulo, exceto pela API pública (`@app/<outro>`).
