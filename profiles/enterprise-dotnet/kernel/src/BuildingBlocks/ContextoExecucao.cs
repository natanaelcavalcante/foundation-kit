namespace BuildingBlocks;

/// <summary>Quem está executando. Montado SEMPRE a partir do token/sessão no servidor — nunca de dados do cliente.</summary>
public sealed record ContextoExecucao(Guid UsuarioId, Guid TenantId, IReadOnlySet<string> Permissoes, string TraceId)
{
    public Result<Unit> ExigirPermissao(string permissao) =>
        Permissoes.Contains(permissao)
            ? Result.Sucesso()
            : Result.Falha(new Falha("ACESSO_NEGADO", TipoFalha.Proibido, Detalhes: new Dictionary<string, object?> { ["permissao"] = permissao }));
}
