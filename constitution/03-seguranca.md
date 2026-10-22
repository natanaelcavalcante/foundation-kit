# Constituição 03 — Segurança da Informação

Base: OWASP ASVS nível 2 (nível 3 no perfil enterprise) e OWASP Top 10.

## Autenticação
- Senha com hash **Argon2id** (fallback: bcrypt custo ≥ 12). Nunca reversível.
- Política de senha por tamanho (≥ 10), checagem contra senhas vazadas (k-anonymity HIBP), sem regras de composição absurdas.
- **MFA**: TOTP obrigatório para papéis administrativos e opcional para os demais; códigos de recuperação de uso único (armazenados com hash).
- Verificação de e-mail no cadastro. Recuperação de senha por **token de uso único, com hash no banco, expiração ≤ 30 min**,
  que invalida todas as sessões ao trocar a senha.
- Resposta idêntica para "e-mail existe" e "não existe" (evita enumeração de usuários).
- Sessões: access token curto (≤ 15 min) + refresh token rotativo com detecção de reuso, **ou** sessão em servidor (Redis)
  com cookie `HttpOnly; Secure; SameSite=Lax`. Logout invalida no servidor.

## Força bruta e abuso
- Rate limit por IP **e** por conta (Redis): por exemplo, 5 falhas de login em 15 min → bloqueio progressivo + CAPTCHA.
- Rate limit global na borda (Cloudflare/proxy) e por rota sensível (login, reset, MFA, cadastro).
- Alertas de segurança por e-mail: novo dispositivo, troca de senha, MFA desativado.

## Autorização
- **Negar por padrão.** Toda rota exige autenticação, salvo lista explícita de rotas públicas.
- RBAC por permissões granulares (`os:iniciar`), não por nome de papel no código.
- **Verificação de propriedade/tenant em toda query** (evita IDOR). O ID do usuário/tenant vem do token, **nunca** do body/query.
- Quando o banco suportar, **Row Level Security** como segunda barreira.

## Dados e transporte
- TLS em tudo (HSTS). Headers: CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors.
- Toda entrada é validada por schema na fronteira; toda query é parametrizada (ORM).
- Upload: validação de tipo real (magic bytes), limite de tamanho, nome gerado no servidor, storage fora do webroot, URLs assinadas.
- Segredos só em variáveis de ambiente/cofre; nunca no repositório. `.env.example` sem valores reais.
- Logs sem senha, token, documento ou cartão. Mascarar PII.

## Criptografia em repouso (proteção em caso de vazamento)
- Campos sensíveis (CPF, telefone, endereço, dados de saúde/financeiros, tokens de integração) são cifrados **na aplicação**
  com **AES-256-GCM** (envelope encryption: chave de dados cifrada por uma chave mestra no KMS/cofre/variável segura).
- Para busca exata em campo cifrado: coluna adicional com **HMAC-SHA256** (blind index).
- Rotação de chaves documentada e suportada (o campo guarda a versão da chave).
- Backups cifrados. Um dump vazado do banco não deve expor nenhum dado sensível legível.

## Cadeia de suprimentos
- Lockfile versionado, auditoria de dependências no CI, Dependabot/Renovate, imagens Docker mínimas e não-root.
