# Constituição 04 — LGPD e Privacidade

- **Inventário de dados**: cada spec de módulo declara quais dados pessoais trata, a finalidade e a base legal
  (seção "Dados pessoais" do template de spec).
- **Minimização**: coletar apenas o necessário para a finalidade declarada.
- **Consentimento** registrado (o quê, quando, versão do termo, IP) quando a base legal for consentimento; revogável.
- **Direitos do titular** (art. 18), implementados no módulo `privacy`: acesso/exportação (JSON), correção,
  anonimização/eliminação, revogação de consentimento. Prazo de atendimento registrado.
- **Retenção**: cada tipo de dado tem um prazo; um job periódico anonimiza ou elimina o que venceu (respeitando obrigações legais, como as fiscais).
- **Anonimização ≠ soft delete**: eliminar o titular remove ou irreversivelmente embaralha a PII, preservando a integridade de registros contábeis.
- **Trilha de auditoria** de acesso a dados sensíveis (quem, quando, o quê), imutável (append-only).
- **Incidentes**: procedimento documentado (`docs/incidente.md`) para comunicação à ANPD e aos titulares.
- Páginas de Política de Privacidade e Termos, versionadas; aceite registrado.
