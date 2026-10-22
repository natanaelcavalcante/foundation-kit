# Continuar daqui — estado do Foundation Kit (22/10/2026)

Documento de passagem para retomar o trabalho em outra máquina ou com outro agente.
Para retomar: clone este repositório, abra-o no agente e diga **"Leia o CONTINUAR.md e vamos seguir"**.

## O que é
Kit de fundação de projetos da fábrica: Spec Driven Development (OpenSpec) + constituição universal (DDD, SOLID, testes,
segurança, LGPD) + protocolo de 4 fases com gates de aprovação humana + perfis de stack. Ver `README.md`.

## Decisões já tomadas (não reabrir sem motivo)
- O kit vive num repositório próprio e é instalado em cada projeto por `scripts/install.sh` (ou `scripts/novo-projeto.sh`, que baixa do GitHub).
- Specs com **OpenSpec**.
- Perfis: `web-nextjs` (Next.js + Tailwind/shadcn + Postgres + Prisma + Redis + Caddy + Cloudflare R2), `enterprise-dotnet` (.NET 10 + EF Core + Angular),
  `mobile-kotlin` (Kotlin + Compose, backend de um dos outros). Sempre Docker.
- Idioma: pt-BR em tudo por padrão; código em inglês e UI multi-idioma só quando o brief pedir.
- Autenticação baseada no fluxo do **NexusCMS** (TOTP obrigatório no 1º acesso, código por e-mail, recuperação de senha), endurecido.
- E-mail pelo **SMTP próprio no Dokploy** (o mesmo do NexusCMS), com as mesmas variáveis `MAIL_*`.
- Cursor Cloud é suportado: `.cursor/environment.json` + `.cursor/Dockerfile` + seção cloud no `AGENTS.md`.

## O que está pronto e verificado
| Item | Verificação |
|---|---|
| Constituição, protocolo (4 fases + refatoração), 7 foundation-specs, templates | escritos |
| `install.sh` | testado (idempotente, preserva `state.json`) |
| Kernel web-nextjs (TS) | 22 testes, 100% |
| Referência `identity` web-nextjs | 93 testes, 100% de linhas (Prisma e telas Next ainda sem teste) |
| Kernel enterprise-dotnet (C#, .NET 10) | 18 testes |
| Kernel mobile-kotlin | 8 testes, 100% (Kover) |
| Skills: 13 web-nextjs, 15 enterprise-dotnet, 11 mobile-kotlin | escritas; trechos de código não compilados |

## Pendências (em ordem)
1. **Publicar o kit no GitHub (privado)**: este repositório local ainda não tinha remoto quando este documento foi escrito.
2. **Piloto**: seguir o `TESTE.md` com o exemplo da oficina (localmente ou no Cursor Cloud) e trazer a lista do que falhou.
3. Testar no primeiro Build do Cursor Cloud: `.cursor/Dockerfile` (não foi construído; não havia Docker na máquina).
4. Docker Compose, Dockerfiles e CI dos perfis: escritos, nunca executados.
5. Referência `identity` testada também para .NET (hoje é a skill `identity-aspnet`) e endpoint de token para apps nativos no web-nextjs.
6. Decidir por ADR o substituto do MediatR (licença comercial a partir da v13) no perfil .NET.

## Alerta de segurança (fora do kit)
O repositório público **NexusCMS** continha `connect-vps.exp` com a senha de root do VPS em texto puro (além de `connect-vps.sh` e `cookie.txt`).
Ações recomendadas: trocar a senha de root, usar só login SSH por chave, revisar acessos (`last`, `/var/log/auth.log`),
remover os arquivos e limpar o histórico (`git filter-repo`) ou tornar o repositório privado.

## Ambiente da máquina original (para referência)
- GitHub CLI instalado em `~/.local/bin/gh` (o Homebrew desatualizado falhou ao instalar); `gh auth login` ainda não feito.
- .NET SDK 10 e Java 21 disponíveis; sem Docker.
