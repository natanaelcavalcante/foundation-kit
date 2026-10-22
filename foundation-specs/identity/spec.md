# identity — Autenticação e credenciais

> Implementação de referência testada: `profiles/web-nextjs/reference/identity/` (fluxo baseado no NexusCMS).

## ADDED Requirements

### Requirement: Cadastro com verificação de e-mail
O sistema SHALL permitir o cadastro (modo `{{cadastro: aberto|convite|admin}}`, padrão convite) com e-mail e senha.
A conta MUST permanecer `PENDENTE_VERIFICACAO` até o e-mail ser confirmado por um token de uso único (expira em 24h, armazenado com hash).

#### Scenario: Cadastro válido
- **WHEN** um visitante se cadastra com e-mail válido e senha conforme a política
- **THEN** a conta é criada como `PENDENTE_VERIFICACAO`, a senha é armazenada com Argon2id e um e-mail de verificação é enviado

#### Scenario: Senha vazada ou curta
- **WHEN** a senha tem menos de 10 caracteres ou consta em base de senhas vazadas
- **THEN** o cadastro é recusado com o erro `SENHA_FRACA`

#### Scenario: E-mail já existente não é revelado
- **WHEN** alguém se cadastra com um e-mail já existente
- **THEN** a resposta é idêntica à de sucesso e o titular recebe um e-mail de aviso

#### Scenario: Token de verificação reutilizado ou expirado
- **WHEN** um token já usado ou expirado é enviado
- **THEN** a verificação falha com `TOKEN_INVALIDO` e a conta não muda de estado

---

### Requirement: Login seguro
O sistema SHALL autenticar por e-mail e senha, emitindo sessão conforme o perfil (cookie HttpOnly ou access token curto + refresh rotativo).

#### Scenario: Credenciais válidas sem MFA
- **WHEN** um usuário verificado envia credenciais corretas e não tem MFA
- **THEN** uma sessão é criada e o evento `LOGIN_SUCESSO` é auditado

#### Scenario: Credenciais inválidas
- **WHEN** o e-mail não existe ou a senha está errada
- **THEN** a resposta é `CREDENCIAIS_INVALIDAS`, com o mesmo tempo de resposta nos dois casos, e a falha é contabilizada no rate limit

#### Scenario: Conta não verificada, bloqueada ou desativada
- **WHEN** a conta não está `ATIVA`
- **THEN** o login é negado sem revelar o motivo exato a terceiros

---

### Requirement: MFA por TOTP
O sistema SHALL suportar MFA TOTP com códigos de recuperação (10, de uso único, armazenados com hash).
O MFA MUST ser obrigatório para os papéis `{{papeis_mfa_obrigatorio: [admin]}}`.

#### Scenario: Login com MFA
- **WHEN** um usuário com MFA acerta a senha
- **THEN** recebe um desafio MFA, e a sessão só é emitida após um código TOTP válido (janela ±1)

#### Scenario: Reuso de código TOTP
- **WHEN** o mesmo código TOTP é enviado duas vezes na janela
- **THEN** a segunda tentativa é recusada

#### Scenario: Papel exige MFA
- **WHEN** um usuário de papel com MFA obrigatório faz login sem MFA configurado
- **THEN** recebe o QR Code de cadastro (segredo cifrado no banco) e só obtém sessão após confirmar um código válido, recebendo 10 códigos de recuperação

#### Scenario: Desafio limitado
- **WHEN** 5 códigos errados são enviados no mesmo desafio, ou ele passa de 10 minutos
- **THEN** o desafio é descartado e o login recomeça pela senha

---

### Requirement: Código por e-mail como alternativa ao app
O sistema SHALL permitir, durante o desafio de verificação, receber um código de 6 dígitos por e-mail (validade de 10 min, intervalo mínimo de 60s entre envios, armazenado como HMAC vinculado ao desafio). O usuário MAY definir o e-mail como método preferido.

#### Scenario: Solicitar código por e-mail durante o desafio
- **WHEN** o usuário pede o código por e-mail
- **THEN** recebe o código no e-mail cadastrado, e o código só vale para aquele desafio, uma única vez

#### Scenario: Reenvio antes de 60s
- **WHEN** um novo envio é pedido em menos de 60s
- **THEN** é recusado com `CODIGO_REENVIO_MUITO_CEDO`

---

### Requirement: Códigos de recuperação
O sistema SHALL aceitar códigos de recuperação de uso único no desafio, avisando o titular por e-mail a cada uso.

#### Scenario: Código de recuperação entra uma única vez
- **WHEN** um código de recuperação válido é usado
- **THEN** a sessão é emitida, o código é invalidado e o titular recebe um alerta com a quantidade restante

#### Scenario: Desativar MFA
- **WHEN** um usuário desativa o MFA
- **THEN** precisa reautenticar com senha + TOTP, e recebe um e-mail de alerta

---

### Requirement: Recuperação de senha
O sistema SHALL enviar um link de redefinição com token de uso único (hash no banco, expira em 30 min).

#### Scenario: Solicitação não revela existência do e-mail
- **WHEN** a recuperação é solicitada para qualquer e-mail
- **THEN** a resposta é sempre a mesma; o e-mail só é enviado se a conta existir

#### Scenario: Redefinição bem-sucedida
- **WHEN** um token válido e uma nova senha conforme a política são enviados
- **THEN** a senha é trocada, o token é invalidado, **todas as sessões são revogadas** e um e-mail de alerta é enviado

---

### Requirement: Sessões e logout
O sistema SHALL permitir listar e revogar sessões ativas. O refresh token MUST ser rotativo; a reutilização de um refresh token já usado MUST revogar toda a família de sessões.

#### Scenario: Logout
- **WHEN** o usuário faz logout
- **THEN** a sessão é invalidada no servidor, e o token antigo passa a retornar 401

#### Scenario: Reuso de refresh token
- **WHEN** um refresh token já rotacionado é apresentado
- **THEN** todas as sessões daquela família são revogadas e o evento é auditado como `SUSPEITA_ROUBO_SESSAO`
