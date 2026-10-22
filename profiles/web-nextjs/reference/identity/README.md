# Referência: módulo identity (perfil web-nextjs)

Implementação **testada** do módulo de fundação `identity`, baseada no fluxo de autenticação do NexusCMS (Laravel/Filament)
e endurecida para cumprir `constitution/03-seguranca.md`. Na Fase 3, copie para o projeto em vez de reescrever.

## Fluxo (igual ao NexusCMS)
1. E-mail + senha → a sessão **não** é emitida.
2. Primeiro acesso → cadastro obrigatório do app autenticador (QR Code) → confirma com um código → recebe 10 códigos de recuperação.
3. Próximos acessos → código do app **ou** código de 6 dígitos por e-mail (válido por 10 min) **ou** código de recuperação.
4. Esqueci a senha → link por e-mail com token de uso único.

## O que foi endurecido em relação ao NexusCMS
| NexusCMS | Aqui |
|---|---|
| Segredo TOTP em texto claro no banco | Cifrado com AES-256-GCM (`Cifrador`) |
| Código TOTP podia ser reutilizado dentro da janela | `ultimoPassoTotp` impede o reuso |
| Tentativas ilimitadas de código 2FA na sessão pendente | 5 tentativas por desafio; esgotou → recomeça o login |
| Código por e-mail em SHA-256 puro (6 dígitos = quebrável offline) | HMAC com chave do servidor, vinculado ao desafio |
| Sem códigos de recuperação | 10 códigos de uso único (só os hashes ficam guardados) |
| Rate limit só por IP | Por conta **e** por IP, bloqueio progressivo, e-mail de alerta |
| Link de redefinição válido por 60 min, sessões continuam | 30 min, uso único atômico, revoga todas as sessões, e-mail de aviso |
| Política de senha por composição | Tamanho (10–128) + checagem em base de senhas vazadas (HIBP k-anonymity) |
| Logs com e-mail em claro | Auditoria por `usuarioId`; nada de senha, código ou token em log |
| Tempo de resposta diferente para e-mail inexistente | Hash fictício verificado (tempo igual) |

## E-mail
`EnviadorSmtp` usa as **mesmas variáveis** do NexusCMS (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`). Para usar o servidor de e-mail próprio do Dokploy, copie os valores do
`.env` do Nexus. Em dev, `MAIL_HOST=localhost MAIL_PORT=1025 MAIL_ENCRYPTION=null` (Mailpit do docker-compose).

## Conteúdo
| Pasta | Destino no projeto | Testado aqui? |
|---|---|---|
| `src/dominio`, `src/aplicacao` | `modules/identity/src/` | ✅ unitário (fakes) |
| `src/infra/*.ts`, `src/infra/email`, `src/infra/redis` | `packages/infra/src/identity/` | ✅ (crypto/Argon2 reais, Redis via ioredis-mock, SMTP com transporte fake) |
| `src/infra/prisma` | `prisma/schema/identity.prisma` + `packages/infra` | ❌ cobrir com teste de integração (Testcontainers) no projeto |
| `web/` | `apps/web/src/modules/identity/` | ❌ cobrir com E2E (ver `web/TELAS.md`) |

## Rodar os testes
Copie `kernel/` e esta pasta mantendo a posição relativa (`../../kernel`), depois `npm i && npm run coverage`.
Resultado da última execução: **93 testes, 100% das linhas, 93% dos branches**.

## Variáveis
`CHAVE_MESTRA`, `CHAVE_INDICE` (32 bytes base64 cada: `openssl rand -base64 32`), `CHAVE_VERSAO`, `CHAVE_MESTRA_ANTERIOR` (só durante rotação),
`MAIL_*`, `APP_URL`, `APP_NAME`, `APP_COR_PRIMARIA`, `MFA_OBRIGATORIO` (padrão `true`, como no NexusCMS).
