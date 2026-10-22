# Fase 4 — Construção Módulo a Módulo

Repita para cada módulo, na ordem do `ARCHITECTURE.md`:

1. **Revisão da spec**: apresente a spec proposta (`openspec/changes/<modulo>/`). Destaque as regras, as premissas e as
   dúvidas em aberto. Ajuste até o responsável dizer **"spec aprovada"**. Registre em `state.json → modules.<m>.spec_approved_at`.
   *Sem aprovação, não há código.*
2. **Tasks**: decomponha em `tasks.md` (domínio → aplicação → infraestrutura → interface → front).
3. **TDD por camada**: para cada `Scenario`, escreva o teste primeiro, depois a implementação. Use as skills do projeto.
4. **Testes obrigatórios além dos unitários**:
   - integração dos repositórios/queries com banco real;
   - autorização (401/403/IDOR/tenant) em cada rota;
   - **abuso**: chamar a API diretamente tentando violar cada RN (estados inválidos, concorrência, IDs alheios,
     valores fora de faixa, replays). Para regras de exclusividade (por exemplo: "um mecânico, uma OS ativa"),
     inclua um teste de **concorrência** (duas requisições simultâneas) e uma garantia no banco (constraint/lock).
   - E2E do fluxo principal.
5. **Verificação**: suíte **inteira** do projeto verde, cobertura do módulo ≥ 80%, lint/build/segurança limpos.
6. **DoD** (`constitution/05-definition-of-done.md`) item a item → `openspec archive` → atualize `state.json` e CHANGELOG.
7. Informe ao responsável: resumo, evidências (cobertura, nº de testes) e o próximo módulo.

## Mudanças posteriores
Toda alteração de comportamento é uma nova change OpenSpec (propose → aprovação → apply → archive).
Bug: siga o fluxo "bug → teste de regressão" de `constitution/02-testes.md`.
