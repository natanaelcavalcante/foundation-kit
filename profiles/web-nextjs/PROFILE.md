# Perfil: web-nextjs

**Quando:** produtos web, SaaS, MVPs, sites com SEO/tráfego pago, equipe enxuta.

## Stack
| Camada | Escolha | Por quê |
|---|---|---|
| Front + API | **Next.js (App Router, TypeScript strict)** com SSR/RSC, Route Handlers e Server Actions | SEO e velocidade; front e API no mesmo deploy |
| UI | **Tailwind + shadcn/ui** | Visual premium e consistente, com pouco código próprio |
| Validação | **Zod** (schemas compartilhados entre front e back) | Uma fonte de verdade para a entrada |
| Banco | **PostgreSQL 16** + `pgcrypto` + **Row Level Security** | Criptografia por coluna e isolamento linha a linha |
| ORM | **Prisma** (padrão) ou Drizzle (ADR) | Queries parametrizadas; migrations versionadas |
| Cache/filas/rate limit | **Redis** + BullMQ | Rate limit, sessões, jobs (IA, importação, e-mail, retenção) |
| Arquivos/imagens | **Cloudflare R2** (S3-compatível), URLs assinadas; dev: MinIO no Docker | `next/image` gera WebP/AVIF em vários tamanhos |
| Auth | Implementação de referência testada em `reference/identity` (fluxo do NexusCMS: TOTP obrigatório + código por e-mail + códigos de recuperação), Argon2id, sessão em Redis + cookie `__Host-` | Copiada na Fase 3 |
| E-mail | **SMTP do servidor próprio (Dokploy)**, o mesmo do NexusCMS, via nodemailer; dev: Mailpit no Docker | Variáveis `MAIL_*` idênticas às do Laravel |
| Proxy | **Caddy** (HTTPS automático, headers, limite por IP) | |
| Borda | **Cloudflare** (DNS, WAF, rate limit, cache, R2) | O plano gratuito basta para começar |
| i18n | `next-intl` (quando multi-idioma) | |
| Testes | **Vitest** (unit/integração), **Testcontainers** (Postgres/Redis reais), **Playwright** (E2E), **Stryker** (mutação) | |
| Qualidade | ESLint, Prettier, `tsc --noEmit`, `npm audit`, gitleaks, Semgrep | |

## Estrutura
```
/
├── apps/web/                       # Next.js
│   ├── src/app/(public)/ (private)/ api/
│   ├── src/modules/<modulo>/        # interface: componentes, server actions, rotas, schemas de form
│   └── src/shared/                  # UI shared, providers, http, i18n
├── modules/<modulo>/               # pacote TS PURO: domínio + aplicação (entity, vo, use-case, ports, dto)
│   └── src/ + test/
├── packages/
│   ├── kernel/                      # Result, Entity, ValueObject, erros, Money, Cifrador (porta)
│   └── infra/                       # Prisma, Redis, R2, mailer, cifrador AES-GCM, rate limiter (adapters)
├── prisma/  schema/<modulo>.prisma  migrations/  seed/
├── docker/  Caddyfile
├── docker-compose.yml               # web, postgres, redis, minio, mailpit, caddy
├── openspec/  docs/  .foundation/
└── turbo.json                       # pipelines lint/typecheck/test/build
```
**Regra:** `modules/*` não importa nada de Next, Prisma ou Redis. As Route Handlers/Server Actions são finas:
validam com Zod → montam o caso de uso com os adapters → mapeiam `Result` para resposta.

## Mapeamentos específicos
- RLS: `SET app.tenant_id` por transação via extensão do Prisma Client; políticas por tabela na migration.
- Rate limit: algoritmo sliding window no Redis, middleware para rotas sensíveis.
- CSP com nonce em `middleware.ts`.
- Server Actions sempre revalidam a sessão e as permissões (nunca confie em estado vindo do cliente).

## Comandos padrão (o agente deve usar)
`docker compose up -d` · `npm run test` · `npm run test:int` · `npm run test:e2e` · `npm run coverage` · `npx prisma migrate dev`
