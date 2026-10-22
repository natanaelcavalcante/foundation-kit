# user-management — Gestão de usuários

## ADDED Requirements

### Requirement: Convite e ciclo de vida do usuário
Administradores com `usuarios:gerenciar` SHALL convidar usuários (link de uso único, 72h), atribuir papéis, bloquear, desbloquear e desativar.
Estados: `CONVIDADO → ATIVO ⇄ BLOQUEADO → DESATIVADO`.

#### Scenario: Desativar usuário encerra acesso imediatamente
- **WHEN** um admin desativa um usuário
- **THEN** todas as sessões dele são revogadas na hora, e as requisições seguintes retornam 401

#### Scenario: Último administrador
- **WHEN** alguém tenta remover o papel ou desativar o último administrador do tenant
- **THEN** a operação é negada com `ULTIMO_ADMIN`

#### Scenario: Admin não gerencia usuários de outro tenant
- **WHEN** um admin tenta alterar um usuário de outro tenant
- **THEN** recebe 404

---

### Requirement: Perfil próprio
O usuário SHALL editar o próprio nome, avatar e preferências (idioma, fuso). A troca de e-mail MUST exigir senha atual + confirmação no novo e-mail, e um aviso para o e-mail antigo.

#### Scenario: Troca de e-mail
- **WHEN** o usuário solicita a troca de e-mail com a senha correta
- **THEN** o e-mail só muda após a confirmação no novo endereço, e o antigo recebe um alerta
