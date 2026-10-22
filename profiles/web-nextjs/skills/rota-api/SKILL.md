---
name: rota-api
description: Cria ou revisa Route Handlers (app/api/**/route.ts) e Server Actions no perfil web-nextjs — camada fina que valida com Zod, obtém a sessão, monta o ContextoExecucao, chama o caso de uso e mapeia Result para HTTP. Inclui os testes obrigatórios de autenticação, autorização, IDOR e mass assignment. Usar ao expor um caso de uso para a UI ou para clientes externos.
---

# Rota de API / Server Action

## Helper único (criado na Fase 3) — `apps/web/src/shared/server/handler.ts`
```ts
export function rota<S extends z.ZodTypeAny, O>(opts: { schema: S; publica?: false }, fn: (entrada: z.infer<S>, ctx: ContextoExecucao) => Promise<Result<O>>) {
  return async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const ctx = await contextoDaSessao(req);            // 401 se não houver sessão válida; carrega permissões do banco/cache
    if (!ctx) return erro(401, 'NAO_AUTENTICADO');
    const bruto = { ...(await lerCorpo(req)), ...(await params) };
    const entrada = opts.schema.safeParse(bruto);       // schema .strict(): rejeita campos extras
    if (!entrada.success) return erro(422, 'ENTRADA_INVALIDA', entrada.error.flatten());
    const r = await fn(entrada.data, ctx);
    return r.ok ? Response.json(r.valor) : erroDeFalhas(r.falhas, ctx.traceId); // HTTP_POR_TIPO
  };
}
```
O mesmo princípio vale para Server Actions (`acao(schema, fn)`): **sempre** revalidam a sessão e as permissões. Uma Server Action é um endpoint público.

## Template — `apps/web/src/app/api/os/[osId]/iniciar/route.ts`
```ts
const schema = z.object({ osId: z.string().uuid(), mecanicoId: z.string().uuid() }).strict();
export const POST = rota({ schema }, (e, ctx) => container().iniciarOs.executar(e, ctx));
```
- **Nenhuma** regra de negócio na rota. Nada de `tenantId`/`usuarioId` no schema.
- Rotas públicas: declare-as explicitamente em `rotasPublicas.ts` (é o teste de negação por padrão que lê essa lista).
- O rate limit das rotas sensíveis é aplicado no `middleware.ts`/helper (ver `security-hardening`).

## Testes obrigatórios — `apps/web/test/api/os-iniciar.int.test.ts`
Chame o handler com `Request` real, banco real e sessões de fábrica (`sessaoDe({ papel, tenant })`):
| Caso | Esperado |
|---|---|
| sem sessão | 401 |
| sessão sem a permissão | 403 `ACESSO_NEGADO` |
| OS de outro tenant | 404 |
| body com `tenantId`/`status` extras | 422 (strict), e o estado não muda |
| entrada inválida | 422 com campos |
| regra violada (por exemplo, mecânico ocupado) | 409 `MECANICO_OCUPADO` |
| sucesso | 200 + DTO + estado persistido |
| erro inesperado | 500 com `traceId`, sem stack |
