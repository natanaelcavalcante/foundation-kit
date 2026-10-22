---
name: campo-sensivel
description: Aplica a proteção de dados pessoais/sensíveis a um campo no perfil web-nextjs — cifragem AES-256-GCM via porta Cifrador, blind index HMAC para busca exata, mascaramento em logs, exportação e anonimização LGPD. Usar sempre que a spec marcar um campo como sensível (CPF, telefone, endereço, dados de saúde/financeiros, tokens de integração).
---

# Campo sensível

## Passos
1. **Spec**: confirme a linha na tabela "Dados pessoais" (finalidade, retenção, exportável, anonimizável).
2. **Schema Prisma**: `cpfCifrado String` + `cpfIndice String` (se houver busca exata) com `@@unique([tenantId, cpfIndice])` quando for único.
   Nunca guarde o valor em claro em nenhuma outra coluna/tabela/log.
3. **Adapter**: em `fromDomain`, `cifrador.cifrar(cpf.valor)` e `cifrador.indiceCego(cpf.valor)` (com o valor **normalizado** pelo VO).
   Em `toDomain`, `cifrador.decifrar(...)` + `Cpf.criar(...)`.
4. **Busca**: `where: { tenantId, cpfIndice: cifrador.indiceCego(cpfNormalizado) }`.
5. **Logs**: adicione o caminho do campo ao redator do `observability` (`redact: ['*.cpf', ...]`).
6. **LGPD**: implemente no módulo o `ExportadorDadosPessoais` (inclui o campo decifrado) e o `AnonimizadorDadosPessoais`
   (substitui por um valor irreversível, por exemplo `cifrar('ANONIMIZADO:' + uuid)`, e limpa o índice). Registre os dois no módulo `privacy`.
7. **DTO**: exponha mascarado por padrão (`***.456.789-**`). O valor completo só aparece em um caso de uso específico, com permissão própria e auditoria.

## Implementação do Cifrador (Fase 3, `packages/infra/src/cripto/cifrador-aes-gcm.ts`) — resumo
- Chave de dados por versão, cifrada pela chave mestra (`CHAVE_MESTRA` em cofre/variável); formato `v{n}:{iv_b64}:{tag+ct_b64}`; IV aleatório de 12 bytes por valor.
- `indiceCego` = HMAC-SHA256 com `CHAVE_INDICE` separada.

## Testes obrigatórios
- Integração: leitura crua da tabela → o valor **não** aparece em claro; o round-trip preserva; a busca por índice encontra.
- Adulteração do ciphertext → erro de integridade.
- Log de uma operação com o campo → `[REDACTED]`.
- Exportação contém o campo; após a anonimização, o valor original não é recuperável e a busca não encontra mais.
