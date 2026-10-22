# Foundation Kit — Fábrica de Software

Método de inicialização e refatoração de projetos com **Spec Driven Development (OpenSpec)**,
independente de agente (Claude Code, Codex, Cursor, Opencode) e de stack.

> O domínio muda a cada projeto. A fundação e os princípios, nunca.

## Estrutura

| Pasta | Conteúdo | Muda por projeto? |
|---|---|---|
| `constitution/` | Princípios inegociáveis: arquitetura, testes, segurança, LGPD, DoD, idioma | Nunca |
| `protocol/` | As 4 fases com seus portões (gates) | Nunca |
| `foundation-specs/` | Specs OpenSpec dos módulos universais (identidade, acesso, segurança...) | Nunca (só são instanciadas) |
| `profiles/` | Tradução dos princípios para cada stack | Escolhido na Fase 2 |
| `templates/` | Brief, Arquitetura, ADR, spec de módulo, registro de bug | Preenchidos no projeto |
| `adapters/` | Pontos de entrada finos para cada agente | Instalados no projeto |

## Uso

```bash
# Uma vez por máquina (precisa do GitHub CLI autenticado: gh auth login)
gh repo clone natanaelcavalcante/foundation-kit ~/.foundation-kit

# Novo projeto (atualiza o kit e instala)
mkdir meu-projeto && cd meu-projeto
~/.foundation-kit/scripts/novo-projeto.sh .

# Refatorar projeto existente
cd projeto-existente && ~/.foundation-kit/scripts/novo-projeto.sh . --refactor

# Fixar uma versão do kit
FOUNDATION_KIT_VERSION=v1.0.0 ~/.foundation-kit/scripts/novo-projeto.sh .
```
Depois, no agente: **"Inicie o protocolo de fundação"**.

O instalador copia o kit para `.foundation/` (versionado no projeto, então funciona em agentes cloud como o Cursor Background Agents),
cria `AGENTS.md`, `CLAUDE.md`, a skill do Claude, a regra do Cursor e `.foundation/state.json`. Reinstalar atualiza o kit e preserva o estado.

### Cursor em ambiente cloud
1. Instale localmente, commite e publique o projeto num repositório (privado) do GitHub.
2. Inicie um Background Agent no repositório e peça "Inicie o protocolo de fundação".
3. Responda às perguntas e aprove os gates pelo chat do agente; o `state.json` commitado guarda a fase.
4. Recomendado: Fases 1, 2 e 4 no cloud; Fase 3 localmente (precisa de Docker e de testar o login de verdade).
   Segredos (`MAIL_*`, `CHAVE_*`) nos secrets do ambiente, nunca no repositório.

## Perfis disponíveis

| Perfil | Quando usar | Kernel | Skills | Referências |
|---|---|---|---|---|
| `web-nextjs` | Web, SaaS, tráfego pago, MVP — Next.js + Postgres + Redis + Cloudflare R2 | TypeScript, 22 testes, 100% | 13 | **identity** completo (93 testes) |
| `enterprise-dotnet` | Corporativo, segurança reforçada — .NET 10 + EF Core + Angular | C#, 18 testes | 15 (inclui `identity-aspnet`) | — |
| `mobile-kotlin` | Apps Android/KMP — Kotlin + Compose, backend de um dos perfis acima | Kotlin, 8 testes, 100% | 11 (inclui `autenticacao-app`) | — |

Todos rodam em **Docker**. E-mail transacional pelo **SMTP próprio (Dokploy)**, com as mesmas variáveis `MAIL_*` do NexusCMS.

## O que está verificado e o que não está

| Item | Estado |
|---|---|
| Instalador | ✅ testado (idempotente, preserva `state.json`) |
| Kernels dos 3 perfis | ✅ compilados e testados |
| Referência `identity` (domínio, aplicação, crypto, Argon2, TOTP RFC 6238, Redis, SMTP) | ✅ 93 testes, 100% de linhas |
| Referência `identity`: repositório Prisma e telas/actions Next.js | ⚠️ escritos, sem teste aqui (o projeto cobre com integração/E2E) |
| Trechos de código dentro das skills | ⚠️ modelos de referência, não compilados |
| Docker Compose, Dockerfiles, Caddy/Nginx, CI | ⚠️ escritos, não executados |
| Condução das 4 fases por um agente | ⚠️ não testada — ver `TESTE.md` |
