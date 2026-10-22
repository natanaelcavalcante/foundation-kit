---
name: teste-regressao
description: Conduz a correção de bugs pelo fluxo obrigatório bug → teste de regressão que falha → correção → registro em docs/bugs. Usar sempre que o pedido for corrigir um bug, defeito, erro em produção, comportamento inesperado ou "isso voltou a acontecer".
---

# Bug → teste de regressão

1. **Registrar**: crie `docs/bugs/BUG-NNNN-<slug>.md` com `.foundation/templates/BUG.md` (próximo número livre).
2. **Reproduzir em teste ANTES de corrigir**, no nível mais baixo que reproduz o bug (domínio < aplicação < integração < E2E):
   ```csharp
   [Fact(DisplayName = "regressao: BUG-0042 mecânico conseguia iniciar 2ª OS após pausar e retomar outra")]
   ```
   Rode e **mostre que falha** pelo motivo certo. Se não falhar, você não reproduziu o bug: investigue mais.
3. **Causa raiz**: explique por que aconteceu (não só onde). Verifique se a mesma causa afeta outros pontos e, se afetar, escreva testes para eles também.
4. **Corrigir** com a menor mudança correta. Se a regra estiver mal especificada, atualize a spec (change OpenSpec) e peça aprovação.
5. **Rodar a suíte inteira** e mostrar que está verde.
6. **Completar o registro** (causa, correção, arquivo e nome do teste, ☑ falhava antes, ☑ passa depois).
7. Commit: `fix(<modulo>): <descrição> (BUG-NNNN)`.

**Nunca** remova, enfraqueça ou marque como `Skip` um teste `regressao:` sem um ADR aprovado.
