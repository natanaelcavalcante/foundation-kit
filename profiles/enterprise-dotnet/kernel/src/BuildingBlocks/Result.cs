namespace BuildingBlocks;

/// <summary>Resultado de operações que podem falhar de forma esperada. Exceções ficam para o inesperado.</summary>
public sealed class Result<T>
{
    private readonly T? _valor;

    private Result(T? valor, IReadOnlyList<Falha> falhas)
    {
        _valor = valor;
        Falhas = falhas;
    }

    public IReadOnlyList<Falha> Falhas { get; }
    public bool Ok => Falhas.Count == 0;
    public bool Falhou => !Ok;
    public IEnumerable<string> Codigos => Falhas.Select(f => f.Codigo);

    /// <summary>Valor do sucesso. Lança se chamado em uma falha — sempre cheque <see cref="Ok"/> antes.</summary>
    public T Valor => Ok ? _valor! : throw new InvalidOperationException($"Acesso a valor de Result com falha: {string.Join(", ", Codigos)}");

    public static Result<T> Sucesso(T valor) => new(valor, []);

    public static Result<T> Falha(params IEnumerable<Falha> falhas)
    {
        var lista = falhas.ToList();
        return lista.Count == 0 ? throw new ArgumentException("Result.Falha exige ao menos uma falha", nameof(falhas)) : new(default, lista);
    }

    public Result<TOut> Map<TOut>(Func<T, TOut> fn) => Ok ? Result<TOut>.Sucesso(fn(_valor!)) : Result<TOut>.Falha(Falhas);
    public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> fn) => Ok ? fn(_valor!) : Result<TOut>.Falha(Falhas);

    public static implicit operator Result<T>(T valor) => Sucesso(valor);
    public static implicit operator Result<T>(Falha falha) => Falha(falha);
}

public readonly record struct Unit
{
    public static readonly Unit Valor;
}

public static class Result
{
    public static Result<Unit> Sucesso() => Result<Unit>.Sucesso(Unit.Valor);
    public static Result<Unit> Falha(params IEnumerable<Falha> falhas) => Result<Unit>.Falha(falhas);

    /// <summary>Agrega todas as falhas (útil para validar vários VOs de uma vez).</summary>
    public static Result<(T1, T2)> Combinar<T1, T2>(Result<T1> a, Result<T2> b) =>
        a.Ok && b.Ok ? Result<(T1, T2)>.Sucesso((a.Valor, b.Valor)) : Result<(T1, T2)>.Falha(a.Falhas.Concat(b.Falhas));

    public static Result<(T1, T2, T3)> Combinar<T1, T2, T3>(Result<T1> a, Result<T2> b, Result<T3> c) =>
        a.Ok && b.Ok && c.Ok ? Result<(T1, T2, T3)>.Sucesso((a.Valor, b.Valor, c.Valor)) : Result<(T1, T2, T3)>.Falha(a.Falhas.Concat(b.Falhas).Concat(c.Falhas));
}
