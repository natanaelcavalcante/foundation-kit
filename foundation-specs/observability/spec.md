# observability — Logs, auditoria e saúde

## ADDED Requirements

### Requirement: Log estruturado sem PII
O sistema SHALL emitir logs JSON com `traceId`, nível, módulo e evento. Senhas, tokens, documentos e cartões MUST ser mascarados por um redator central.

#### Scenario: Log de requisição com senha
- **WHEN** uma requisição de login é logada
- **THEN** o campo de senha aparece como `[REDACTED]`

---

### Requirement: Trilha de auditoria imutável
O sistema SHALL registrar eventos de segurança e de acesso a dados sensíveis (quem, quando, o quê, IP, resultado) em armazenamento append-only.

#### Scenario: Tentativa de alterar auditoria
- **WHEN** qualquer código ou usuário tenta atualizar/excluir um registro de auditoria
- **THEN** a operação é impossível (permissões de banco/trigger) e o teste comprova isso

---

### Requirement: Health checks e tratamento global de erros
O sistema SHALL expor `/health/live` e `/health/ready` (dependências: banco, Redis, storage). Erros inesperados MUST retornar uma mensagem genérica + `traceId`, sem stack trace.

#### Scenario: Erro inesperado
- **WHEN** ocorre uma exceção não tratada
- **THEN** o cliente recebe 500 com `traceId`, e o log contém o detalhe completo
