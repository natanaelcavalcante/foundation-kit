# Roteiro de teste do Foundation Kit

Objetivo: validar o kit de ponta a ponta com um projeto real e anotar o que precisa mudar.

## 0. Preparação
```bash
cd ~/Downloads/foundation-kit && git log --oneline     # confira a versão
mkdir -p ~/projetos/oficina-piloto && cd ~/projetos/oficina-piloto
~/Downloads/foundation-kit/scripts/install.sh .
```
Abra o agente (Claude Code, Codex, Cursor ou Opencode) na pasta e diga: **"Inicie o protocolo de fundação"**.

## 1. Fase 1 — Discovery (o que observar)
Cole a ideia: *"Sistema de Gestão de Oficinas: controle de OS, veículos no pátio, histórico de manutenção por cliente. Regra: um mecânico
não pode atuar em duas OS simultaneamente; para iniciar ou continuar outra, precisa pausar a atual e justificar."*
- [ ] Faz perguntas em blocos de até 5, pula as que você já respondeu e propõe respostas-padrão?
- [ ] Reescreve cada regra de forma testável e pergunta casos de borda (ex.: "e se fechar o app com a OS em andamento?")?
- [ ] Gera `docs/PROJECT_BRIEF.md` com RN numeradas, atores, glossário e dados pessoais?
- [ ] **Para e espera** você dizer "brief aprovado"?

## 2. Fase 2 — Arquitetura
- [ ] Escolhe o perfil com justificativa (deveria ser `web-nextjs` para esse caso)?
- [ ] Lista **todos** os módulos de fundação + os de domínio (ordem-servico, veiculo, cliente, patio...), com dependências em Mermaid?
- [ ] Propõe MCPs e skills, e cria ADRs?
- [ ] **Para e espera** "arquitetura aprovada"?

## 3. Fase 3 — Fundação (a mais longa)
- [ ] Usa a skill `config-projeto` e copia o kernel e as skills?
- [ ] **Copia a referência `identity`** em vez de reescrever?
- [ ] `docker compose up -d` sobe Postgres, Redis, MinIO e Mailpit?
- [ ] Login de verdade: 1º acesso pede QR Code → Google Authenticator → códigos de recuperação → entra.
- [ ] Código por e-mail chega no Mailpit (`http://localhost:8025`). Depois, troque as variáveis `MAIL_*` pelas do NexusCMS e confirme a chegada na sua caixa real.
- [ ] 5 senhas erradas → bloqueio + e-mail de alerta. Esqueci a senha → link → nova senha → as sessões antigas caem.
- [ ] Gera as specs dos módulos de domínio **sem implementar**?
- [ ] Gera `docs/FOUNDATION_REPORT.md` com evidências e espera "fundação aprovada"?

## 4. Fase 4 — Um módulo (ordem-servico)
- [ ] Mostra a spec, com cenários de **burla** e de **concorrência** para a regra do mecânico, e espera "spec aprovada"?
- [ ] Usa as skills (entidade → caso-de-uso → repositorio → rota-api → form → teste-seguranca)?
- [ ] Cria o índice único parcial no banco para a regra do mecânico?
- [ ] Testa duas requisições simultâneas e mostra a cobertura (≥ 80%) e a suíte inteira verde antes de concluir?

## 5. Teste de regressão
Peça: *"Bug: consegui iniciar duas OS abrindo duas abas"*.
- [ ] Cria `docs/bugs/BUG-0001.md`, escreve o teste que **falha primeiro**, corrige e mostra que passa?

## 6. Outros agentes
Repita a Fase 1 em pelo menos um outro agente (Codex ou Cursor) e veja se ele segue o `AGENTS.md` sem ajuda.

## Como reportar
Para cada item que falhar, anote a fase, o agente, o que ele fez e o que deveria ter feito. Traga a lista: cada item vira uma correção no kit.
