namespace BuildingBlocks;

public sealed record PaginaEntrada(int Pagina, int Tamanho)
{
    public const int TamanhoMaximo = 100;

    public static PaginaEntrada Normalizar(int? pagina = null, int? tamanho = null) =>
        new(Math.Max(1, pagina ?? 1), Math.Clamp(tamanho ?? 20, 1, TamanhoMaximo));

    public int Pular => (Pagina - 1) * Tamanho;
}

public sealed record Pagina<T>(IReadOnlyList<T> Itens, int Total, int Numero, int Tamanho);
