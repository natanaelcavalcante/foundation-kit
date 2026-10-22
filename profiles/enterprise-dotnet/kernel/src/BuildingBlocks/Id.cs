namespace BuildingBlocks;

public sealed record Id : IValueObject<Guid>
{
    private Id(Guid valor) => Valor = valor;

    public Guid Valor { get; }

    public static Id Novo() => new(Guid.CreateVersion7());

    public static Result<Id> Criar(string? bruto, string campo = "id") =>
        Guid.TryParse(bruto, out var g) && g != Guid.Empty ? new Id(g) : Falha.Validacao("ID_INVALIDO", campo);

    public static Id De(Guid valor) => valor == Guid.Empty ? throw new ArgumentException("Guid vazio", nameof(valor)) : new(valor);

    public override string ToString() => Valor.ToString();
}
