# Padrões comuns às skills (perfil web-nextjs)

## Caminhos
| Camada | Caminho |
|---|---|
| Kernel | `packages/kernel/src` (importar de `@app/kernel`) |
| Domínio + aplicação do módulo | `modules/<modulo>/src/{dominio,aplicacao}` (importar de `@app/<modulo>`) |
| Testes do módulo | `modules/<modulo>/test/{dominio,aplicacao}` |
| Adapters (Prisma, Redis, R2, e-mail, cifrador) | `packages/infra/src/<modulo>/` |
| Composição (montar casos de uso com adapters) | `apps/web/src/modules/<modulo>/server/container.ts` |
| Rotas/Server Actions | `apps/web/src/app/api/<recurso>/route.ts`, `apps/web/src/modules/<modulo>/server/actions.ts` |
| UI do módulo | `apps/web/src/modules/<modulo>/{components,schemas}` |
| Schema Prisma | `prisma/schema/<modulo>.prisma` |

## Nomes (idioma pt-BR, padrão da constituição)
- Arquivos em kebab-case com sufixo de tipo: `ordem-servico.entity.ts`, `placa.vo.ts`, `iniciar-os.use-case.ts`,
  `ordem-servico.repository.ts` (porta), `ordem-servico.prisma.ts` (adapter), `listar-os.query.ts`.
- Classes: `OrdemServico`, `Placa`, `IniciarOs`, `OrdemServicoPrismaRepository`.
- Códigos de falha: `SCREAMING_SNAKE_CASE`, específicos (`MECANICO_OCUPADO`, e não `ERRO`).
- Se o brief definir `idioma_codigo: en`, traduza os nomes e mantenha os padrões.

## Regras que toda skill verifica
1. O domínio não importa nada de `next`, `@prisma/client`, `ioredis` ou `node:*` (exceto `crypto` global).
2. Nada de `new Date()` no domínio/aplicação: use a porta `Relogio`.
3. `tenantId`/`usuarioId` vêm do `ContextoExecucao` (sessão), nunca da entrada.
4. Cada `Scenario` da spec tem um teste com o **mesmo nome** do cenário.
5. Falhas esperadas → `Result.fail(falha(...))`; `throw` só para bugs/infra.
6. Rode `npm run test -w @app/<modulo>` e confira a cobertura do módulo (≥ 80%; domínio próximo de 100%).
