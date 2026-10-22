namespace BuildingBlocks;

/// <summary>
/// VOs são <c>sealed record</c> (imutáveis e iguais por valor) com construtor privado e
/// <c>static Result&lt;T&gt; Criar(...)</c>. Esta interface só marca e expõe o valor canônico.
/// </summary>
public interface IValueObject<out TValor>
{
    TValor Valor { get; }
}
