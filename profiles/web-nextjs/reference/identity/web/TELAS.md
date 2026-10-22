# Telas do identity (apps/web/src/app/(public)/...)

| Rota | Tela | Action |
|---|---|---|
| `/login` | e-mail + senha | `loginAction` → etapa `MFA_CADASTRO` ou `MFA_DESAFIO` (guarde `desafioId` no estado do componente, nunca em localStorage) |
| `/login` (etapa cadastro) | QR Code (gerar SVG no servidor a partir da `uri` com `qrcode`), segredo para digitação manual, campo de 6 dígitos | `confirmarCadastroMfaAction` → mostrar os 10 códigos de recuperação com botões "copiar" e "baixar .txt" e checkbox "guardei meus códigos" |
| `/login` (etapa desafio) | campo de 6 dígitos; links "Receber código por e-mail" e "Usar código de recuperação" (mesmo fluxo do NexusCMS) | `verificarMfaAction`, `solicitarCodigoEmailAction` (botão desabilitado por 60s após envio) |
| `/esqueci-senha` | e-mail → mensagem fixa "Se o e-mail existir, você receberá um link" | `solicitarRedefinicaoAction` |
| `/redefinir-senha?token=` | nova senha + confirmação + medidor de força | `redefinirSenhaAction` → redireciona para `/login` |

Mensagens por código de falha (i18n `erros.*`): `CREDENCIAIS_INVALIDAS`, `TENTATIVAS_EXCEDIDAS` (mostrar horário de liberação),
`CONTA_INDISPONIVEL`, `CODIGO_INVALIDO` (mostrar tentativas restantes), `DESAFIO_ESGOTADO`/`DESAFIO_INVALIDO` (voltar ao passo 1),
`CODIGO_REENVIO_MUITO_CEDO`, `SENHA_FRACA`, `SENHA_VAZADA`, `TOKEN_INVALIDO`.

E2E (Playwright + Mailpit API `http://localhost:8025/api/v1/messages`): primeiro acesso com cadastro de TOTP (gere o código no teste com o segredo exibido),
login com TOTP, login com código por e-mail lido do Mailpit, código de recuperação, esqueci a senha → link do Mailpit → nova senha → login.
