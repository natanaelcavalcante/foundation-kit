# Fase 3 — Implementação da Fundação

**Objetivo:** base em padrão de produção, antes de qualquer módulo de domínio.

## Ordem de execução
1. **Scaffold** do perfil (`profiles/<p>/PROFILE.md` → seção Estrutura): monorepo/solução, Docker Compose,
   lint/format, configuração de testes e cobertura, CI.
2. **OpenSpec**: `openspec init`. Preencha `openspec/config.yaml` → `context` com o resumo do brief e da arquitetura,
   e `rules` apontando para `.foundation/constitution/`.
3. **Shared kernel**: se o perfil traz `kernel/` pronto, copie-o e rode os testes; senão, implemente Result, Falha, Entity, ValueObject, Id, Money, ContextoExecucao e paginação no mesmo desenho do kernel do `web-nextjs`.
4. **Skills do projeto**: se o perfil tem `profiles/<p>/skills/` prontas, copie-as para `.claude/skills/` (a skill `config-projeto` já faz isso).
   Se o perfil só tem a lista em `SKILLS.md`, gere as skills seguindo o formato das do `web-nextjs`. Ao longo do projeto, troque os exemplos genéricos por exemplos reais do projeto.
5. **Módulos de fundação**, nesta ordem, cada um como uma *change* OpenSpec a partir de `foundation-specs/`
   (copie o spec, ajuste os nomes ao idioma do projeto, implemente e teste):
   `observability` → `data-protection` → `identity` → `access-governance` → `user-management` → `security-hardening` → `privacy`.
   Esses specs já são aprovados por padrão; mostre ao responsável apenas os ajustes que fizer.
   **Se o perfil tiver `profiles/<p>/reference/<modulo>/`, copie a implementação de referência (já testada) em vez de reescrever**,
   e adapte nomes/idioma. Escreva os testes de integração e E2E que a referência indica como pendentes.
6. **Frontend base**: layout público/privado, login, cadastro, recuperação, MFA, gestão de usuários, perfil,
   tela de privacidade (exportar/excluir dados), tratamento global de erros, estados de loading e vazio.
7. **Specs dos módulos de domínio**: para cada módulo do `ARCHITECTURE.md`, crie uma change proposta
   (`openspec/changes/<modulo>/`) com o template `templates/MODULE_SPEC.md`, cobrindo cada `RN-xxx` com cenários,
   **incluindo cenários de tentativa de burla**. Não implemente.
8. **Verificação**: rode tudo do zero (`docker compose down -v && up`), a suíte completa e o checklist da
   DoD de fundação (`constitution/05-definition-of-done.md`). Gere `docs/FOUNDATION_REPORT.md` com as evidências.

## Gate
O gate é automático (tudo verde) + o responsável confirma o relatório: "fundação aprovada". `state.json`: `phase: 4`.
