namespace BuildingBlocks;

/// <summary>Dinheiro em centavos inteiros (nunca decimal/float em cálculo). Moeda única por projeto, salvo ADR.</summary>
public sealed record Money : IValueObject<long>
{
    private Money(long centavos) => Valor = centavos;

    public long Valor { get; }
    public long Centavos => Valor;
    public static Money Zero { get; } = new(0);

    public static Result<Money> DeCentavos(long centavos, string campo = "valor") =>
        centavos < 0 ? Falha.Validacao("VALOR_NEGATIVO", campo) : new Money(centavos);

    public Money Somar(Money outro) => new(checked(Valor + outro.Valor));
    public Money Multiplicar(decimal quantidade) => new((long)Math.Round(Valor * quantidade, MidpointRounding.AwayFromZero));

    /// <summary>Aplica percentual (0–100) arredondando meio centavo para cima.</summary>
    public Money Percentual(decimal p) => new((long)Math.Round(Valor * p / 100m, MidpointRounding.AwayFromZero));

    public Result<Money> Subtrair(Money outro) => outro.Valor > Valor ? Falha.Regra("VALOR_NEGATIVO") : new Money(Valor - outro.Valor);
}
