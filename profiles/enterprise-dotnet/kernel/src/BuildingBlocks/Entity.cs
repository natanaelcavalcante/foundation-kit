namespace BuildingBlocks;

public sealed record EventoDominio(string Nome, DateTimeOffset OcorridoEm, IReadOnlyDictionary<string, object?> Dados);

/// <summary>
/// Entidade: identidade + invariantes. Estado só muda por métodos de domínio que retornam Result e nunca
/// deixam a entidade inválida. Subclasses: construtor privado + <c>Criar</c> (nova) e <c>Restaurar</c> (do banco).
/// Para o EF Core, use um construtor privado sem parâmetros e mapeie campos privados.
/// </summary>
public abstract class Entity
{
    private readonly List<EventoDominio> _eventos = [];

    protected Entity(Id id) => Id = id;

    public Id Id { get; }

    protected void Registrar(string nome, DateTimeOffset ocorridoEm, IReadOnlyDictionary<string, object?> dados) =>
        _eventos.Add(new EventoDominio(nome, ocorridoEm, dados));

    /// <summary>Retorna e limpa os eventos pendentes — chamado pelo interceptor de outbox ao salvar.</summary>
    public IReadOnlyList<EventoDominio> ExtrairEventos()
    {
        var copia = _eventos.ToList();
        _eventos.Clear();
        return copia;
    }

    public override bool Equals(object? obj) => obj is Entity outra && outra.GetType() == GetType() && outra.Id == Id;
    public override int GetHashCode() => HashCode.Combine(GetType(), Id);
}
