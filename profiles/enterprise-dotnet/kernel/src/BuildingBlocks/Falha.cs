namespace BuildingBlocks;

/// <summary>Categoria da falha: a camada de API traduz para HTTP.</summary>
public enum TipoFalha
{
    Validacao,
    RegraNegocio,
    /// <summary>Também usado para recurso de outro tenant (não revela existência).</summary>
    NaoEncontrado,
    Conflito,
    NaoAutenticado,
    Proibido,
    LimiteExcedido,
}

/// <param name="Codigo">Código estável em SCREAMING_SNAKE_CASE, usado em testes, i18n e clientes.</param>
public sealed record Falha(string Codigo, TipoFalha Tipo, string? Campo = null, IReadOnlyDictionary<string, object?>? Detalhes = null)
{
    public static Falha Validacao(string codigo, string? campo = null) => new(codigo, TipoFalha.Validacao, campo);
    public static Falha Regra(string codigo, IReadOnlyDictionary<string, object?>? detalhes = null) => new(codigo, TipoFalha.RegraNegocio, Detalhes: detalhes);
    public static Falha NaoEncontrado(string codigo) => new(codigo, TipoFalha.NaoEncontrado);
    public static Falha Conflito(string codigo) => new(codigo, TipoFalha.Conflito);
    public static Falha Proibido(string codigo = "ACESSO_NEGADO") => new(codigo, TipoFalha.Proibido);

    public int StatusHttp => Tipo switch
    {
        TipoFalha.Validacao or TipoFalha.RegraNegocio => 422,
        TipoFalha.NaoEncontrado => 404,
        TipoFalha.Conflito => 409,
        TipoFalha.NaoAutenticado => 401,
        TipoFalha.Proibido => 403,
        TipoFalha.LimiteExcedido => 429,
        _ => 500,
    };
}
