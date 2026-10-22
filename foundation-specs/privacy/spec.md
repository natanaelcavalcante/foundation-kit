# privacy — LGPD e direitos do titular

## ADDED Requirements

### Requirement: Registro de consentimento e termos
O sistema SHALL registrar o aceite de Termos/Política (versão, data, IP) e consentimentos por finalidade, revogáveis.

#### Scenario: Nova versão dos termos
- **WHEN** uma nova versão dos termos é publicada
- **THEN** o usuário precisa aceitá-la no próximo acesso, e o aceite é registrado

---

### Requirement: Exportação de dados do titular
O usuário SHALL solicitar a exportação dos seus dados pessoais em JSON. Cada módulo com dados pessoais MUST implementar o contrato `ExportadorDadosPessoais`.

#### Scenario: Exportação completa
- **WHEN** o titular solicita a exportação
- **THEN** recebe (por link temporário, após reautenticação) um arquivo com os dados de todos os módulos registrados, e nenhum dado de terceiros

---

### Requirement: Eliminação/anonimização
O titular SHALL solicitar a eliminação. Cada módulo MUST implementar `AnonimizadorDadosPessoais`, preservando registros com obrigação legal de retenção, mas sem PII.

#### Scenario: Conta eliminada
- **WHEN** a eliminação é confirmada (após o período de carência `{{carencia_dias: 7}}`)
- **THEN** a PII é removida/irreversivelmente anonimizada, as sessões são revogadas e o login passa a falhar

---

### Requirement: Retenção
Um job periódico SHALL aplicar as políticas de retenção declaradas nas specs.

#### Scenario: Dado vencido
- **WHEN** um registro ultrapassa o prazo de retenção
- **THEN** é anonimizado/eliminado, e a ação é auditada
