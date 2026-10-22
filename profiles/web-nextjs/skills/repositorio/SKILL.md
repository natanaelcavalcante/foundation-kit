---
name: repositorio
description: Cria ou revisa repositórios no perfil web-nextjs — a porta (*.repository.ts em modules/*/src/aplicacao) e o adapter Prisma (*.prisma.ts em packages/infra), com filtro de tenant, mapeamento toDomain/fromDomain, tradução de constraints para falhas de negócio e testes de integração com Postgres real (Testcontainers). Usar ao persistir um agregado.
---

# Repositório (escrita)

## Porta — `modules/oficina/src/aplicacao/ordem-servico.repository.ts`
```ts
import type { Id, Result } from '@app/kernel';
import type { OrdemServico } from '../dominio/ordem-servico.entity';

export interface OrdemServicoRepository {
  buscarPorId(id: Id, tenantId: string): Promise<OrdemServico | null>;
  buscarEmExecucaoDoMecanico(mecanicoId: Id, tenantId: string): Promise<OrdemServico | null>;
  salvar(os: OrdemServico): Promise<Result<void>>;
}
```
- Um repositório por **agregado raiz**. Métodos com nomes do negócio, não CRUD genérico.
- **Todo** método de busca recebe `tenantId`.
- Leituras para tela/listagem **não** ficam aqui: use `query-cqrs`.

## Schema — `prisma/schema/oficina.prisma`
```prisma
model OrdemServico {
  id          String   @id @db.Uuid
  tenantId    String   @db.Uuid
  veiculoId   String   @db.Uuid
  status      StatusOs
  mecanicoId  String?  @db.Uuid
  criadaEm    DateTime
  atualizadaEm DateTime @updatedAt
  versao      Int      @default(0)   // lock otimista
  pausas      PausaOs[]
  @@index([tenantId, status])
  @@map("ordem_servico")
}
```
Na migration SQL, adicione o que o Prisma não expressa:
```sql
-- RN-001: garantia no banco, à prova de concorrência
CREATE UNIQUE INDEX uq_os_mecanico_em_execucao ON ordem_servico (tenant_id, mecanico_id) WHERE status = 'EM_EXECUCAO';
-- Segunda barreira de tenant (RLS)
ALTER TABLE ordem_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ordem_servico USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Adapter — `packages/infra/src/oficina/ordem-servico.prisma.ts`
```ts
export class OrdemServicoPrismaRepository implements OrdemServicoRepository {
  constructor(private readonly db: DbCliente) {} // DbCliente = client da transação corrente (com app.tenant_id setado)

  async buscarPorId(id: Id, tenantId: string) {
    const row = await this.db.ordemServico.findFirst({ where: { id: id.valor, tenantId }, include: { pausas: true } });
    return row ? toDomain(row) : null;
  }

  async salvar(os: OrdemServico): Promise<Result<void>> {
    try {
      const data = fromDomain(os);
      await this.db.ordemServico.upsert({ where: { id: data.id }, create: data, update: { ...data, versao: { increment: 1 } } });
      return Result.ok();
    } catch (e) {
      if (violouIndice(e, 'uq_os_mecanico_em_execucao')) return Result.fail(falha('MECANICO_OCUPADO', 'conflito'));
      throw e; // inesperado
    }
  }
}
```
- `toDomain` usa `Entidade.restaurar(...)`; `fromDomain` lê os getters. Os dois ficam no mesmo arquivo, privados.
- Campos sensíveis: cifre em `fromDomain` e decifre em `toDomain` (ver skill `campo-sensivel`).
- Despache os eventos (`os.extrairEventos()`) para a tabela de outbox **na mesma transação**.

## Fake para testes de aplicação — `modules/oficina/test/fakes/ordem-servico.repo.fake.ts`
Implementação em memória que respeita tenant e simula a constraint de exclusividade (para os testes de caso de uso).

## Testes de integração obrigatórios — `packages/infra/test/oficina/ordem-servico.prisma.int.test.ts`
Postgres real via Testcontainers, com migrations aplicadas:
- ida e volta (`salvar` → `buscarPorId`) preserva todos os campos;
- `buscarPorId` com outro `tenantId` → `null`;
- **RLS**: uma query crua com `app.tenant_id` de outro tenant não retorna linhas;
- **concorrência**: duas transações paralelas iniciando OSs para o mesmo mecânico → exatamente uma passa, a outra recebe `MECANICO_OCUPADO`;
- campos sensíveis aparecem cifrados numa leitura crua da tabela.
