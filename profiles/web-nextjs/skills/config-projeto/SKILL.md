---
name: config-projeto
description: Faz o scaffold inicial (Fase 3, passo 1) de um projeto no perfil web-nextjs — monorepo npm workspaces + Turbo, Next.js, packages/kernel e packages/infra, Prisma com schema modular, Docker Compose (Postgres, Redis, MinIO, Mailpit, Caddy), Vitest/Playwright/Stryker e CI. Idempotente. Usar ao iniciar a fundação ou para reconciliar a estrutura de um projeto existente com o perfil.
---

# Scaffold do projeto (web-nextjs)

Idempotente: **nunca sobrescreva** um arquivo existente; mostre o diff proposto e pergunte.

## Passos
1. `npx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git`
   e `npx shadcn@latest init` dentro de `apps/web`.
2. Raiz: `package.json` com `"workspaces": ["apps/*", "packages/*", "modules/*"]`, `turbo.json`, `tsconfig.base.json` (strict,
   `noUncheckedIndexedAccess`, paths `@app/*`), `.prettierrc`, `.editorconfig`, `.nvmrc` (LTS), `.env.example`.
3. `packages/kernel`: copie `.foundation/profiles/web-nextjs/kernel/` inteiro e rode os testes (devem passar com 100%).
4. `packages/infra`: crie `src/{db,cripto,cache,storage,email,observabilidade}` com as implementações das portas do kernel
   (implementadas pelos módulos de fundação na sequência).
5. Prisma: `prisma/schema/base.prisma` (generator + datasource, `previewFeatures = ["prismaSchemaFolder"]` se a versão exigir),
   `prisma/seed/index.ts`. Uma extensão de client que executa `SET LOCAL app.tenant_id` em cada transação.
6. Copie `assets/` desta skill: `docker-compose.yml`, `docker/Caddyfile`, `docker/web.Dockerfile`, `.github/workflows/ci.yml`.
7. Testes: Vitest por workspace (unit `*.test.ts`, integração `*.int.test.ts` com `@testcontainers/postgresql` e `@testcontainers/redis`),
   Playwright em `apps/web/e2e`, Stryker configurado para `modules/*/src/dominio`.
8. Scripts da raiz: `dev`, `build`, `lint`, `typecheck`, `test`, `test:int`, `test:e2e`, `coverage`, `mutation`, `db:migrate`, `db:seed`.
9. Copie as skills do perfil para o agente: `.foundation/profiles/web-nextjs/skills/*` → `.claude/skills/` (exceto `config-projeto`, que já cumpriu seu papel, e `_padroes`, que vai junto como referência).
10. Verifique: `docker compose up -d && npm i && npm run db:migrate && npm run lint && npm run typecheck && npm run test`.

## Variáveis (.env.example)
`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (R2 em produção, MinIO em dev),
`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` (mesmas do NexusCMS — servidor SMTP próprio no Dokploy; Mailpit em dev), `APP_URL`, `CHAVE_MESTRA` (32 bytes base64), `CHAVE_INDICE` (32 bytes base64), `SESSAO_SEGREDO`.
Gere valores de dev com `openssl rand -base64 32`. Nenhum valor real no repositório.
