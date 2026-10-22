# data-protection — Criptografia de dados sensíveis

## ADDED Requirements

### Requirement: Criptografia em nível de campo
O sistema SHALL fornecer um serviço `Cifrador` (porta no shared kernel) com AES-256-GCM e envelope encryption.
Campos marcados como sensíveis nas specs MUST ser persistidos cifrados, no formato `v{versaoChave}:{nonce}:{ciphertext}`.

#### Scenario: Dump do banco não expõe dados
- **WHEN** a tabela de um campo sensível é lida diretamente no banco
- **THEN** nenhum valor em texto claro é encontrado (teste de integração)

#### Scenario: Adulteração detectada
- **WHEN** um ciphertext é alterado no banco
- **THEN** a decifragem falha com erro de integridade (GCM), sem retornar dado corrompido

---

### Requirement: Busca por campo cifrado
Para campos que precisam de busca exata (CPF, e-mail quando aplicável), o sistema SHALL manter um blind index HMAC-SHA256 com chave separada.

#### Scenario: Busca por CPF
- **WHEN** se busca um cliente pelo CPF
- **THEN** a busca usa o HMAC do valor normalizado e encontra o registro sem decifrar a tabela

---

### Requirement: Rotação de chaves
O sistema SHALL suportar múltiplas versões de chave ativas para leitura e uma para escrita, com um job de re-cifragem.

#### Scenario: Nova chave
- **WHEN** a chave de escrita é rotacionada
- **THEN** os dados antigos continuam legíveis, os novos usam a nova versão, e o job migra os antigos
