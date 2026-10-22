---
name: novo-modulo
description: Cria o scaffold de um novo módulo no perfil enterprise-dotnet (4 projetos Domain/Application/Infrastructure/Api, projetos de teste, registro no Host, schema próprio no banco e feature Angular) a partir de uma spec OpenSpec aprovada. Usar ao iniciar um módulo na Fase 4.
---

# Novo módulo (.NET)

**Pré-condição:** `.foundation/state.json → modules.<m>.spec_approved_at` preenchido. Se não estiver, PARE e peça a aprovação.

## Passos
1. Leia a spec e `../_padroes/PADROES.md`.
2. Crie `src/Modules/<M>/{<M>.Domain,<M>.Application,<M>.Infrastructure,<M>.Api}` (classlib) e `tests/<M>.UnitTests`, `tests/<M>.IntegrationTests`; adicione à `.slnx`.
3. Referências: Domain → BuildingBlocks; Application → Domain; Infrastructure → Application; Api → Application.
4. `<M>.Infrastructure/<M>DbContext.cs` com `HasDefaultSchema("<m>")` (cada módulo tem seu schema; nada de FK entre schemas — referencie por Id).
5. `<M>.Api/<M>Modulo.cs`: `public static IServiceCollection Add<M>(this IServiceCollection s, IConfiguration c)` e `MapGroup("/api/<m>")`. Registre no Host.
6. Permissões do módulo (`<recurso>:<acao>`) no seed do `access-governance` e como policies (`options.AddPolicy("os:iniciar", p => p.RequireClaim("perm", "os:iniciar"))`).
7. `web/src/app/features/<m>/` com rotas lazy, guard de permissão e serviço HTTP tipado.
8. Tasks em `openspec/changes/<m>/tasks.md`; siga TDD: `value-object` → `entidade` → `comando`/`query` → `repositorio-ef` → `endpoint` → `feature-angular` → `teste-seguranca`.

## Checklist
- [ ] `tests/ArchitectureTests` continua verde com o módulo novo.
- [ ] Nenhuma referência de projeto entre módulos (só contratos públicos/eventos de integração).
