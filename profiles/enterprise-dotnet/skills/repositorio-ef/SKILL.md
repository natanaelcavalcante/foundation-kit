---
name: repositorio-ef
description: Cria ou revisa repositórios e mapeamentos EF Core no perfil enterprise-dotnet — porta na Application, implementação na Infrastructure, IEntityTypeConfiguration, Global Query Filter de tenant, índices únicos filtrados para regras de exclusividade, RLS, outbox de eventos e migrations. Usar ao persistir um agregado.
---

# Repositório EF Core

## Porta (Application)
```csharp
public interface IOrdemServicoRepository
{
    Task<OrdemServico?> BuscarPorId(Id id, Guid tenantId, CancellationToken ct);
    Task<OrdemServico?> BuscarEmExecucaoDoMecanico(Id mecanicoId, Guid tenantId, CancellationToken ct);
    void Adicionar(OrdemServico os);
}
public interface IUnitOfWork { Task<Result<Unit>> SalvarAsync(CancellationToken ct); }
```

## Configuração (Infrastructure)
```csharp
internal sealed class OrdemServicoConfig : IEntityTypeConfiguration<OrdemServico>
{
    public void Configure(EntityTypeBuilder<OrdemServico> b)
    {
        b.ToTable("ordem_servico");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasConversion(v => v.Valor, v => Id.De(v));
        b.Property(x => x.Status).HasConversion<string>();
        b.Property(x => x.Versao).IsRowVersion();
        // RN-001 garantida no banco, à prova de concorrência
        b.HasIndex(x => new { x.TenantId, x.MecanicoId }).IsUnique().HasFilter("status = 'EmExecucao'").HasDatabaseName("uq_os_mecanico_em_execucao");
        b.Navigation(x => x.Pausas).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
```
- No `DbContext`: `modelBuilder.Entity<OrdemServico>().HasQueryFilter(x => x.TenantId == _tenant.TenantId)`.
- Na migration: `migrationBuilder.Sql("ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ...")` e um interceptor de conexão que executa `SET app.tenant_id`.
- `UnitOfWork.SalvarAsync`: um `SaveChangesInterceptor` grava os eventos (`ExtrairEventos`) na tabela `outbox` na mesma transação; captura `DbUpdateException` com `PostgresException { SqlState: "23505", ConstraintName: "uq_os_mecanico_em_execucao" }` → `Falha.Conflito("MECANICO_OCUPADO")`, e `DbUpdateConcurrencyException` → `Falha.Conflito("REGISTRO_ALTERADO")`.

## Testes de integração obrigatórios (Testcontainers)
Ida e volta preserva os campos; outro tenant → `null`; RLS com uma query crua; **concorrência** (duas transações paralelas → exatamente uma passa); outbox gravado na mesma transação; campos sensíveis cifrados numa leitura crua.
