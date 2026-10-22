# security-hardening — Força bruta, abuso e borda

## ADDED Requirements

### Requirement: Rate limiting e bloqueio progressivo
O sistema SHALL limitar tentativas em rotas sensíveis por IP e por identificador de conta (contadores em `{{store: Redis}}`).
Padrões: login 5 falhas/15 min por conta → bloqueio de 15 min, dobrando a cada reincidência; 20/min por IP; reset de senha 3/h por conta; cadastro 5/h por IP.

#### Scenario: Força bruta em uma conta
- **WHEN** ocorrem 5 falhas de login seguidas para a mesma conta
- **THEN** a 6ª tentativa recebe 429 `TENTATIVAS_EXCEDIDAS`, **mesmo com a senha correta**, até o fim do bloqueio; o titular recebe um alerta

#### Scenario: Credential stuffing de um IP
- **WHEN** um IP excede o limite de tentativas em contas variadas
- **THEN** o IP recebe 429, e o evento é auditado

#### Scenario: Sucesso zera contador
- **WHEN** o login tem sucesso antes do limite
- **THEN** o contador de falhas da conta é zerado

---

### Requirement: Headers e transporte
Todas as respostas SHALL incluir HSTS, CSP restritiva, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `frame-ancestors 'none'` (salvo exceção em ADR). Cookies de sessão MUST ser `HttpOnly; Secure; SameSite`.

#### Scenario: Verificação de headers
- **WHEN** qualquer página ou rota da API é requisitada
- **THEN** os headers obrigatórios estão presentes (teste automatizado)

---

### Requirement: Validação de entrada e uploads
Toda entrada externa MUST ser validada por schema na fronteira. Uploads MUST validar o tipo real (magic bytes) e o tamanho, renomear no servidor e ser servidos por URL assinada/CDN.

#### Scenario: Payload com campos extras
- **WHEN** a requisição contém campos não declarados (por exemplo `role`, `tenantId`)
- **THEN** eles são descartados ou rejeitados (impede mass assignment)

#### Scenario: Arquivo disfarçado
- **WHEN** um executável é enviado com extensão `.jpg`
- **THEN** o upload é rejeitado
