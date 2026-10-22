---
name: foundation
description: Conduz o protocolo de fundação de projetos da fábrica (Fase 1 Discovery, Fase 2 Arquitetura, Fase 3 Fundação, Fase 4 Módulos, ou modo refatoração) com os gates de aprovação. Usar ao iniciar um projeto novo, refatorar um projeto existente para o padrão, criar/aprovar specs de módulo, verificar a Definition of Done, ou quando o usuário perguntar "em que fase estamos" ou pedir para avançar de fase.
---

1. Leia `.foundation/state.json`. Se não existir, copie `.foundation/protocol/state.example.json` para lá (modo `new` ou `refactor`).
2. Leia `AGENTS.md` e `.foundation/constitution/*.md`.
3. Abra o protocolo da fase atual (`.foundation/protocol/fase-N-*.md` ou `modo-refatoracao.md`) e execute-o.
4. Ao atingir um gate que exige aprovação humana, **pare** e peça a aprovação explícita. Nunca assuma aprovação.
   Só após "aprovado" atualize `state.json` (data e quem aprovou).
5. Para módulos de fundação, parta de `.foundation/foundation-specs/<m>/spec.md`. Para a stack, siga `.foundation/profiles/<profile>/`.
6. Antes de declarar um módulo/fase concluído, rode a suíte completa e percorra `constitution/05-definition-of-done.md`, mostrando as evidências.
