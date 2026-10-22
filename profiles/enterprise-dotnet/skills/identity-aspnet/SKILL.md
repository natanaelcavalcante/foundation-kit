---
name: identity-aspnet
description: Implementa o módulo de fundação identity no perfil enterprise-dotnet sobre ASP.NET Core Identity, reproduzindo o fluxo de referência (NexusCMS endurecido) — cadastro obrigatório de TOTP no primeiro login, código por e-mail como alternativa, códigos de recuperação, lockout progressivo, redefinição de senha com revogação de sessões e SMTP próprio. Usar na Fase 3 ao construir autenticação .NET.
---

# identity no .NET (ASP.NET Core Identity)

Fonte da verdade do comportamento: `.foundation/foundation-specs/identity/spec.md` e os **testes da referência**
`.foundation/profiles/web-nextjs/reference/identity/test/` — porte cada `it(...)` para um `[Fact(DisplayName=...)]` equivalente.

## Mapeamento do fluxo para o Identity
| Requisito | Recurso do ASP.NET Core Identity |
|---|---|
| Hash de senha | `IPasswordHasher<Usuario>` customizado com **Argon2id** (`Konscious.Security.Cryptography.Argon2`), com fallback para verificar hashes PBKDF2 antigos e rehash no login (`PasswordVerificationResult.SuccessRehashNeeded`) |
| Política de senha | `Password.RequiredLength = 10`, regras de composição desligadas + `IPasswordValidator` que consulta o HIBP (k-anonymity, falha aberta) |
| Lockout | `Lockout.MaxFailedAccessAttempts = 5`, `DefaultLockoutTimeSpan = 15min`; a duração **progressiva** (dobra por reincidência, teto de 24h) fica num `ILockoutPolicy` próprio chamado após `AccessFailedAsync` |
| Rate limit por IP | `AddRateLimiter` com política `login` particionada por IP (20/min) **e** por e-mail normalizado |
| Senha correta ≠ sessão | `SignInManager.PasswordSignInAsync` retorna `RequiresTwoFactor`; **nunca** emitir o cookie/JWT final antes do 2º fator. O estado intermediário fica no cookie `Identity.TwoFactorUserId` (cifrado pelo Data Protection) **mais** um desafio no Redis com 5 tentativas e validade de 10 min |
| Primeiro acesso força TOTP | se `!user.TwoFactorEnabled`: `ResetAuthenticatorKeyAsync` → `GetAuthenticatorKeyAsync` → URI `otpauth://` → `VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, codigo)` → `SetTwoFactorEnabledAsync(true)` → `GenerateNewTwoFactorRecoveryCodesAsync(user, 10)` |
| Segredo TOTP cifrado | `IUserAuthenticatorKeyStore` customizado que cifra com `ICifrador` (o padrão do Identity guarda em claro na `AspNetUserTokens`) |
| Reuso de TOTP | registrar o último timestep aceito (claim/coluna `UltimoPassoTotp`) num `IUserTwoFactorTokenProvider` derivado de `AuthenticatorTokenProvider` |
| Código por e-mail | `TokenOptions.DefaultEmailProvider` (6 dígitos) **ou** provider próprio que guarda o HMAC no desafio do Redis (validade de 10 min, intervalo de 60s entre reenvios); `TwoFactorSignInAsync("Email", ...)` |
| Códigos de recuperação | `TwoFactorRecoveryCodeSignInAsync` (já são de uso único e guardados com hash) + e-mail de alerta |
| Redefinição de senha | `GeneratePasswordResetTokenAsync` (`DataProtectionTokenProviderOptions.TokenLifespan = 30min`) → `ResetPasswordAsync` → `UpdateSecurityStampAsync` (invalida todos os cookies/refresh) + e-mail |
| Resposta uniforme | "esqueci a senha" sempre 200; login com e-mail inexistente executa `PasswordHasher.VerifyHashedPassword` contra um hash fictício |
| Sessão | Cookie `__Host-` HttpOnly/Secure/SameSite=Lax com `ValidationInterval` curto do security stamp; para API de terceiros/app, OpenIddict com refresh rotativo |
| SSO corporativo | `AddOpenIdConnect` (Entra ID) — usuários SSO também passam pela política de MFA do IdP |

## E-mail (SMTP próprio, o mesmo do NexusCMS)
`IEmailSender<Usuario>` com **MailKit**, lendo as variáveis `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_ENCRYPTION` (`ssl` → `SecureSocketOptions.SslOnConnect`, `tls` → `StartTls`, `null` → `None` só em dev), `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`.
Templates: copie o HTML de `.foundation/profiles/web-nextjs/reference/identity/src/infra/email/modelos.ts` para Razor/Fluid (mesmos 6 modelos, pt-BR, com escape).

## Endpoints
`POST /api/auth/login`, `/api/auth/mfa/cadastro/confirmar`, `/api/auth/mfa/verificar`, `/api/auth/mfa/codigo-email`,
`/api/auth/senha/esqueci`, `/api/auth/senha/redefinir`, `/api/auth/logout` — todos `AllowAnonymous` + `RequireRateLimiting("login")`, exceto logout.

## Pronto quando
Todos os cenários da spec `identity` e todos os testes da referência TS têm um equivalente xUnit verde (unitário + integração com Testcontainers Postgres/Redis + Mailpit).
