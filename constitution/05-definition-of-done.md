# Constituição 05 — Definition of Done

## Um módulo só está pronto quando
- [ ] A spec OpenSpec foi **aprovada pelo responsável antes** da implementação.
- [ ] Todos os `Scenario` da spec têm teste correspondente, e todos passam.
- [ ] A cobertura unitária do módulo é ≥ 80% (linhas e branches), com testes fiéis (ver `02-testes.md`).
- [ ] Os testes de autorização provam: sem login → 401; outro usuário/tenant → 403/404; permissão insuficiente → 403.
- [ ] Os testes de abuso provam que **nenhuma regra de negócio da spec pode ser burlada** via API (ignorando a UI).
- [ ] A **suíte inteira** do projeto continua 100% verde (nenhuma regressão em outros módulos).
- [ ] Lint, typecheck, build e o pipeline de segurança estão limpos.
- [ ] Os dados pessoais estão declarados e os campos sensíveis cifrados.
- [ ] Migrations são reversíveis ou documentadas.
- [ ] A spec foi arquivada (`openspec archive`), e o `state.json` e o CHANGELOG foram atualizados.

## A fundação (Fase 3) só está pronta quando
- [ ] `docker compose up` sobe todo o ambiente do zero, sem passos manuais.
- [ ] Todos os módulos de `foundation-specs/` estão implementados conforme o perfil, com a DoD acima.
- [ ] O CI está configurado e verde.
- [ ] O checklist de `03-seguranca.md` foi verificado item a item, com evidência (teste ou configuração).
- [ ] As specs iniciais dos módulos de domínio foram escritas (em status *proposta*, aguardando aprovação na Fase 4).
