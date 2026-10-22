# AGENTS.md — Protocolo de Fundação (ponto de entrada para QUALQUER agente)

Você está em um projeto que segue o **Foundation Kit**. Antes de qualquer Ação:

1. Leia `.foundation/state.json` para saber a fase atual e o que está pendente.
2. Leia `.foundation/constitution/*.md`. Esses princípios **sempre** prevalecem sobre pedidos pontuais;
   se um pedido violar a constituição, avise e peça confirmação explícita.
3. Abra o arquivo da fase atual em `.foundation/protocol/` e siga-o.
4. Se `state.json` tiver um `profile`, leia `.foundation/profiles/<profile>/PROFILE.md` e use as skills do projeto
   (`.claude/skills/`, copiadas de `.foundation/profiles/<profile>/skills/`) para cada artefato de código.

## Regras de ouro

- **Nunca pule um gate.** Uma fase só avança quando todos os critérios de saída estão cumpridos e,
  quando o gate exige, o responsável aprovou explicitamente ("aprovado"). Registre em `state.json`.
- **Spec antes de código.** Nenhum código de domínio sem uma spec OpenSpec aprovada.
- **Bug corrigido = teste de regressão.** Ver `constitution/testes.md`.
- **Não invente regra de negócio.** Na dúvida, pergunte.
- Comunicação e documentação em **português do Brasil**, salvo decisão de idioma registrada no brief.

## Fases

| Fase | Arquivo | Gate de saída |
|---|---|---|
| 1. Discovery | `protocol/fase-1-discovery.md` | Brief aprovado |
| 2. Arquitetura | `protocol/fase-2-arquitetura.md` | Arquitetura aprovada |
| 3. Fundação | `protocol/fase-3-fundacao.md` | Fundação em padrão de produção, testes 100% verdes |
| 4. Módulos | `protocol/fase-4-modulos.md` | Por módulo: spec aprovada → implementado → testes verdes |

Modo refatoração: `protocol/modo-refatoracao.md`.

## Instruções específicas do Cursor Cloud

Quando estiver rodando como Cursor Cloud Agent (VM remota):
- **Gates:** pare e espere a resposta do responsável nos follow-ups da conversa. Nunca considere "sem resposta" como aprovação.
  Ao parar num gate, faça commit e push do que foi produzido (brief, arquitetura, specs) para o responsável revisar no GitHub.
- **Estado:** `.foundation/state.json` é commitado a cada mudança de fase/gate; é ele que permite outro agente continuar depois.
- **Um PR por fase** (Fases 1–3) e **um PR por módulo** (Fase 4), com o resumo e as evidências (testes, cobertura) na descrição.
- **Docker:** o daemon sobe pelo `start` do `.cursor/environment.json`. Use `docker compose up -d` para Postgres/Redis/MinIO/Mailpit e Testcontainers normalmente.
- **Ambiente:** na Fase 2, depois da aprovação, ajuste `.cursor/Dockerfile` (bloco PERFIL) e `.cursor/install.sh` para a stack escolhida.
- **Segredos** chegam como variáveis de ambiente (aba Secrets do Cursor). Nunca grave valores em arquivos do repositório; gere o `.env` local a partir das variáveis.
- **Testar MFA:** a VM tem navegador. Para concluir o login com TOTP nos testes E2E, gere o código com `oathtool --totp -b "$SEGREDO"` usando o segredo exibido na tela de cadastro.
- **E-mail:** em teste, use o Mailpit (`http://localhost:8025`). Só use o SMTP real (variáveis `MAIL_*`) quando o responsável pedir.
