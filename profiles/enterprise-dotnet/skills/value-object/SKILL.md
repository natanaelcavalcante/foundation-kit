---
name: value-object
description: Cria ou revisa Value Objects no perfil enterprise-dotnet — sealed record imutável com construtor privado e Criar() que valida e normaliza retornando Result. Usar para atributos com regra de formato, faixa ou normalização (Placa, Email, Cpf, Justificativa).
---

# Value Object (.NET)

## Regras
- `public sealed record Placa : IValueObject<string>` com construtor **privado**, `public static Result<Placa> Criar(string? bruto, string campo = "placa")`.
- Normalize antes de guardar; uma falha por regra, com código e campo.
- Sem I/O. Unicidade é regra do handler, não do VO.
- Para o EF Core: `builder.Property(x => x.Placa).HasConversion(v => v.Valor, v => Placa.Criar(v).Valor)` (os dados do banco já são válidos).
- VOs transversais (Email, Cpf) vão para `BuildingBlocks`.

## Template
```csharp
public sealed partial record Placa : IValueObject<string>
{
    private Placa(string valor) => Valor = valor;
    public string Valor { get; }

    [GeneratedRegex("^[A-Z]{3}[0-9][A-Z][0-9]{2}$")] private static partial Regex Mercosul();
    [GeneratedRegex("^[A-Z]{3}[0-9]{4}$")] private static partial Regex Antiga();

    public static Result<Placa> Criar(string? bruto, string campo = "placa")
    {
        if (string.IsNullOrWhiteSpace(bruto)) return Falha.Validacao("PLACA_OBRIGATORIA", campo);
        var n = bruto.Replace("-", "").Replace(" ", "").ToUpperInvariant();
        return Mercosul().IsMatch(n) || Antiga().IsMatch(n) ? new Placa(n) : Falha.Validacao("PLACA_INVALIDA", campo);
    }
}
```

## Testes
`[Theory]` com válidos (variações de formatação → mesmo valor normalizado), cada inválido com código exato, nulo/vazio e igualdade por valor.
