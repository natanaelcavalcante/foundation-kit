# Fase 2 — Proposta de Arquitetura

**Objetivo:** gerar `docs/ARCHITECTURE.md` (template `templates/ARCHITECTURE.md`) para aprovação.

## Passos
1. **Escolher o perfil** em `profiles/` com base no brief, justificando com critérios:
   - `web-nextjs`: web/SaaS, SEO, MVP rápido, equipe pequena.
   - `enterprise-dotnet`: corporativo, SSO, auditoria pesada, integrações legadas, exigência de segurança elevada.
   - `mobile-kotlin`: app nativo; **combine com um perfil de backend** (registre qual).
   Desvios do perfil (trocar o ORM, adicionar um serviço) viram ADR.
2. **Mapa de módulos**: liste os módulos de fundação (sempre todos de `foundation-specs/`, ou justifique uma exclusão)
   + os **módulos de domínio** derivados do brief (bounded contexts), com:
   - responsabilidade, agregados, regras (`RN-xxx`) que cada módulo implementa;
   - dependências entre módulos (desenhe em Mermaid) — sem ciclos;
   - ordem sugerida de construção na Fase 4.
3. **Modelo de dados inicial** (alto nível) e estratégia de multi-tenant.
4. **MCPs** recomendados para o agente (por exemplo: Postgres, Playwright para E2E, Docker, documentação da stack, GitHub).
5. **Skills** a gerar no projeto: uma por artefato recorrente do perfil (entity, value-object, use-case,
   repository, query, controller/endpoint, form, módulo novo). Elas são derivadas de `profiles/<p>/SKILLS.md`.
6. **Infra**: serviços do `docker-compose`, ambientes (dev/staging/prod), estratégia de deploy e backup.
7. **Riscos e premissas.**
8. ADRs iniciais (`docs/adr/0001-escolha-de-stack.md`, ...).

## Gate
Apresente um resumo e peça revisão. Incorpore os ajustes e reapresente.
**Gate:** "arquitetura aprovada". Atualize `state.json`: `phase: 3`, `profile`, `modules`.
