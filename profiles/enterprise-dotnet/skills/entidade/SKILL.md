---
name: entidade
description: Cria ou revisa entidades e agregados no perfil enterprise-dotnet — classe que herda Entity, construtor privado, Criar/Restaurar, métodos de domínio que retornam Result, tabela de transições e eventos; compatível com EF Core por campos privados. Usar para conceitos com identidade e ciclo de vida.
---

# Entidade / Agregado (.NET)

## Regras
- `public sealed class OrdemServico : Entity`. Propriedades com `private set`; coleções expostas como `IReadOnlyList` sobre um campo `List<>` privado.
- `static Result<OrdemServico> Criar(..., DateTimeOffset agora)` valida com VOs + `Result.Combinar`.
- Construtor privado sem parâmetros (`private OrdemServico() : base(Id.Novo()) { }`) **apenas** para o EF Core.
- Métodos de negócio (`Iniciar`, `Pausar`, `Concluir`): validar → mudar → `Registrar(evento)`. Uma falha não altera nada.
- Transições numa tabela estática (`FrozenDictionary<StatusOs, StatusOs[]>`) → `TRANSICAO_INVALIDA`.
- Regras entre agregados vão para o handler + garantia no banco (índice único filtrado), e não para a entidade.
- Concorrência otimista: `public uint Versao { get; private set; }` mapeado como `IsRowVersion()` (xmin no Postgres).

## Template (trecho)
```csharp
public Result<Unit> Pausar(string? motivo, DateTimeOffset agora)
{
    var r = Result.Combinar(PodeIr(StatusOs.Pausada), Justificativa.Criar(motivo));
    if (r.Falhou) return Result.Falha(r.Falhas);
    Status = StatusOs.Pausada;
    _pausas.Add(new Pausa(r.Valor.Item2.Valor, agora));
    Registrar("OsPausada", agora, new Dictionary<string, object?> { ["osId"] = Id.Valor, ["motivo"] = r.Valor.Item2.Valor });
    return Result.Sucesso();
}
```

## Testes
Criação válida/inválida; matriz completa de transições (`[Theory]` + `MemberData` gerado da tabela); a falha não muda o estado nem gera evento; eventos corretos; datas fixas.
