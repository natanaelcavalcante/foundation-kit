# Constituição 06 — Idioma e Convenções

- **Padrão**: tudo em português do Brasil: conversa, specs, docs, mensagens de commit, UI.
- **Código**: o idioma é decidido na Fase 1 e registrado no brief (`idioma_codigo`):
  - `pt-BR` (padrão): identificadores de domínio em português (`OrdemServico`, `iniciar()`); termos técnicos
    consagrados podem ficar em inglês (`Repository`, `UseCase`, `DTO`).
  - `en`: projetos internacionais ou com equipes externas; a linguagem ubíqua é mantida com glossário PT↔EN.
- **i18n**: se o brief marcar `multi_idioma: true`, todo texto de UI fica em arquivos de tradução desde o primeiro
  componente (nunca hardcoded), e datas, moeda e números são formatados por locale. O padrão é `pt-BR`.
- Commits: Conventional Commits (`feat(os): ...`). Branches: `feat/<modulo>-<descricao>`.
- Formatadores e linters da stack são obrigatórios e rodam no CI.
