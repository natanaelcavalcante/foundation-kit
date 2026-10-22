---
name: teste-seguranca
description: Gera e revisa a suíte de testes de segurança e abuso de um módulo no perfil enterprise-dotnet — autenticação, autorização, IDOR/tenant, mass assignment, burla de regras de negócio, concorrência, rate limit e enumeração. Usar ao finalizar um módulo (antes da DoD), ao revisar um módulo existente ou quando o pedido envolver "testar segurança", "tentar burlar", "pentest do módulo".
---

# Testes de segurança e abuso do módulo

Arquivo: `tests/<Modulo>.IntegrationTests/Seguranca/<Modulo>SegurancaTests.cs` (WebApplicationFactory + Testcontainers). Para **cada rota** do módulo:

## 1. Matriz de acesso (gerada a partir da tabela de permissões da spec)
```ts
const rotas = [{ metodo: 'POST', url: (os) => `/api/os/${os.id}/iniciar`, permissao: 'os:iniciar' }, ...];
describe.each(rotas)('$metodo $permissao', (r) => {
  it('sem sessão → 401', ...);
  it('sem permissão → 403', ...);
  it('recurso de outro tenant → 404', ...);
  it('recurso de outro usuário do mesmo tenant (quando a spec restringe) → 404/403', ...);
});
```

## 2. Burla de regras de negócio (uma por RN da spec)
Pense como um atacante que ignora a UI:
- pular estados (concluir uma OS `ABERTA`), repetir ações (pausar duas vezes), desfazer o irreversível;
- valores de borda (negativos, zero, enormes, strings longas, unicode, datas no passado/futuro);
- **concorrência**: `Task.WhenAll` com N requisições iguais/conflitantes → o invariante se mantém;
- replay da mesma requisição (idempotência quando a spec exige);
- IDs de outra entidade em campos relacionados (por exemplo, `veiculoId` de outro tenant ao criar uma OS).

## 3. Entrada
- Campos extras (`tenantId`, `status`, `role`, `id`) → rejeitados, e o estado não muda.
- Tipos errados, JSON malformado, payload acima do limite.

## 4. Vazamento
- A resposta de erro não contém stack, SQL ou campos internos.
- Listagens não retornam campos proibidos nem itens de outro escopo.

Ao final, liste para o responsável cada RN e o teste de burla que a cobre. Uma RN sem teste de burla é um **bloqueio da DoD**.
