namespace BuildingBlocks;

/// <summary>Abstrai o tempo para testes determinísticos. Em produção: <c>TimeProvider.System</c>.</summary>
public interface IRelogio
{
    DateTimeOffset Agora();
}

/// <summary>Criptografia de campo (AES-256-GCM, envelope). Implementação na Infrastructure.</summary>
public interface ICifrador
{
    string Cifrar(string textoClaro);
    string Decifrar(string cifrado);
    /// <summary>HMAC-SHA256 com chave própria, para busca exata em campo cifrado (blind index).</summary>
    string IndiceCego(string valorNormalizado);
}

public interface IGerenciadorTransacao
{
    Task<T> Executar<T>(Func<CancellationToken, Task<T>> fn, CancellationToken ct = default);
}
