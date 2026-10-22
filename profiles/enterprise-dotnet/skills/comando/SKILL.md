---
name: comando
description: Cria ou revisa casos de uso de escrita no perfil enterprise-dotnet — Command + Handler (MediatR) + Validator (FluentValidation), com permissão, carga por tenant, regras entre agregados, transação e retorno de DTO via Result. Usar para cada intenção do usuário que altera estado.
---

# Comando (caso de uso de escrita)

## Estrutura fixa do Handle
1. `ctx.ExigirPermissao("os:iniciar")`
2. VOs a partir do command (o validator cobre o formato; os VOs cobrem as regras)
3. Carga por tenant: `repo.BuscarPorId(id, ctx.TenantId, ct)` → `null` ⇒ `NaoEncontrado` (o mesmo para outro tenant)
4. Regras entre agregados
5. Método da entidade
6. `unitOfWork.SalvarAsync(ct)`, que traduz a violação do índice único para a falha de negócio
7. Retorna DTO

## Template
```csharp
public sealed record IniciarOsCommand(Guid OsId, Guid MecanicoId) : IRequest<Result<OsDto>>;

public sealed class IniciarOsValidator : AbstractValidator<IniciarOsCommand>
{
    public IniciarOsValidator() { RuleFor(x => x.OsId).NotEmpty(); RuleFor(x => x.MecanicoId).NotEmpty(); }
}

internal sealed class IniciarOsHandler(IOrdemServicoRepository repo, IUnitOfWork uow, IContextoAccessor ctxAccessor, IRelogio relogio)
    : IRequestHandler<IniciarOsCommand, Result<OsDto>>
{
    public async Task<Result<OsDto>> Handle(IniciarOsCommand cmd, CancellationToken ct)
    {
        var ctx = ctxAccessor.Atual;
        var perm = ctx.ExigirPermissao("os:iniciar");
        if (perm.Falhou) return Result<OsDto>.Falha(perm.Falhas);
        if (cmd.MecanicoId != ctx.UsuarioId && !ctx.Permissoes.Contains("os:atribuir")) return Falha.Proibido();

        var os = await repo.BuscarPorId(Id.De(cmd.OsId), ctx.TenantId, ct);
        if (os is null) return Falha.NaoEncontrado("OS_NAO_ENCONTRADA");
        var ativa = await repo.BuscarEmExecucaoDoMecanico(Id.De(cmd.MecanicoId), ctx.TenantId, ct);
        if (ativa is not null && ativa != os) return Falha.Conflito("MECANICO_OCUPADO");

        var r = os.Iniciar(Id.De(cmd.MecanicoId), relogio.Agora());
        if (r.Falhou) return Result<OsDto>.Falha(r.Falhas);
        var salvo = await uow.SalvarAsync(ct);
        return salvo.Map(_ => OsDto.De(os));
    }
}
```
`ContextoExecucao` **nunca** é parâmetro do command (o cliente controlaria). Vem do `IContextoAccessor` (claims).

## Testes (UnitTests)
Repositório **fake em memória** (não mock por método) + `RelogioFixo`. Caminho feliz (estado persistido + DTO), sem permissão, outro tenant, cada RN e sua burla, falha do UoW propagada. `DisplayName` igual ao Scenario.
