# Constituição 02 — Testes e Qualidade

## Pirâmide obrigatória
| Nível | O que cobre | Obrigatoriedade |
|---|---|---|
| Unitário | Entidades, VOs, serviços de domínio, casos de uso (com dublês das portas) | **≥ 80% de linhas E branches** por módulo; meta de 100% no domínio |
| Integração | Repositórios/queries contra banco real (Testcontainers/Docker), rotas HTTP | Todo repositório, toda rota |
| Segurança/Autorização | Acesso sem token, com token de outro usuário/tenant, com papel insuficiente | **Toda rota protegida** |
| Abuso de regra de negócio | Tentativas de burlar cada regra da spec | **Toda regra da spec** |
| E2E | Fluxos críticos do usuário (login, fluxo principal de cada módulo) | Fluxos marcados como críticos |

## Cobertura fiel (anti-teatro)
A cobertura numérica é o piso, não a prova. Um teste só é válido se:
- Cada `Scenario` da spec tem **pelo menos um teste nomeado igual** (rastreabilidade spec ↔ teste).
- Ele verifica **saída e efeito** (estado persistido, evento emitido, erro com código correto), não apenas "não lançou erro".
- Cobre caminho feliz, **limites** (zero, vazio, máximo, datas de borda) e **falhas**.
- Não usa mocks do que está sendo testado; mocks só para portas externas.
- Usa *mutation testing* (Stryker, PIT, Stryker.NET) nos módulos de domínio críticos, quando o perfil suportar,
  com mutation score ≥ 70%.

## Bug → teste de regressão (regra inegociável)
1. Antes de corrigir, escreva um teste que **reproduz o bug e falha**.
2. Corrija até o teste passar.
3. Nomeie com o identificador: `regressao: BUG-0042 mecânico conseguia iniciar 2ª OS após reload`.
4. Registre em `docs/bugs/BUG-XXXX.md` (template `templates/BUG.md`), com causa raiz e o teste vinculado.
5. Testes de regressão **nunca** são removidos ou marcados como skip sem um ADR.

## Pipeline (CI)
Todo push/PR roda: lint → typecheck/build → unitários + cobertura → integração → segurança (SAST,
auditoria de dependências, varredura de segredos) → E2E nos fluxos críticos. **Qualquer falha bloqueia o merge.**
Testes "flaky" são bugs: corrija ou coloque em quarentena com issue aberta. Nunca ignore.
