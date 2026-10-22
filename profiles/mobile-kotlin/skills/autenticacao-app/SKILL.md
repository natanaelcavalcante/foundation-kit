---
name: autenticacao-app
description: Implementa no app (perfil mobile-kotlin) o fluxo de autenticação de referência do kit (NexusCMS endurecido) consumindo o módulo identity do backend — login, cadastro obrigatório de TOTP no primeiro acesso, código por e-mail, códigos de recuperação, esqueci a senha, tokens no Keystore, refresh rotativo e desbloqueio por biometria. Usar na Fase 3 de um projeto com app.
---

# Autenticação no app

Comportamento definido por `.foundation/foundation-specs/identity/spec.md`. **Toda a segurança está no backend**; o app só conduz as etapas.

## Etapas (estado no `LoginViewModel`, nunca persistido)
1. `Credenciais` → `POST /api/auth/login` → resposta `MFA_CADASTRO { desafioId, uri }` ou `MFA_DESAFIO { desafioId, metodo, emailMascarado }`.
2. `CadastroMfa`: mostra o QR Code gerado da `uri` (ZXing) **e** botão "Abrir no app autenticador" (`Intent(ACTION_VIEW, uri)`: abre o Google Authenticator no mesmo celular) + segredo para copiar. Confirma o código → recebe tokens + 10 códigos de recuperação → tela "Guarde seus códigos" (copiar/compartilhar, com checkbox obrigatório).
3. `DesafioMfa`: campo de 6 dígitos com `KeyboardType.NumberPassword` e `autofill` de SMS/OTP desligado; ações "Receber código por e-mail" (botão desabilitado por 60s com contador) e "Usar código de recuperação".
4. Erros por código: `CODIGO_INVALIDO` (mostra tentativas restantes), `DESAFIO_ESGOTADO`/`DESAFIO_INVALIDO` (volta para a etapa 1), `TENTATIVAS_EXCEDIDAS` (mostra até quando).
5. Esqueci a senha: abre a página web de redefinição (`CustomTabsIntent`); o link do e-mail é web. Opcionalmente, App Links para abrir no app.

## Tokens e sessão
- Para app, o backend emite um **access token curto + refresh token rotativo** (o perfil enterprise já usa OpenIddict; no web-nextjs, adicione o endpoint de token para clientes nativos com reuso detectado → revoga a família).
- Os tokens ficam no `ArmazenamentoSeguro` (skill `armazenamento-seguro`), nunca em SharedPreferences puro.
- Refresh no `Authenticator` do OkHttp, serializado por `Mutex`; se falhar → limpa tudo e vai para o login.
- **Biometria** (opcional por usuário): protege o *desbloqueio local* do refresh token (chave do Keystore com `setUserAuthenticationRequired(true)` + `BiometricPrompt` com `CryptoObject`). Não substitui o MFA do login.
- Logout: chama `POST /api/auth/logout`, apaga os tokens, o banco local e os caches de imagem.

## Testes
ViewModel (Turbine) para cada transição de etapa e cada código de erro; MockWebServer para o refresh concorrente (3 requisições com 401 → um único refresh);
Maestro E2E contra o backend do docker-compose: primeiro acesso com TOTP (gerar o código no fluxo com o segredo exibido), código por e-mail lido da API do Mailpit, recuperação.
