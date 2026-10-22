---
name: teste-arquitetura
description: Cria ou atualiza as regras de arquitetura (NetArchTest) do perfil enterprise-dotnet — dependências entre camadas e módulos, Domain sem framework, handlers internos, nomes. Usar ao criar módulo novo ou quando um teste de arquitetura falhar.
---

# Testes de arquitetura

`tests/ArchitectureTests/CamadasTests.cs`, uma regra por teste, para **cada módulo** (`[Theory]` sobre a lista de módulos lida dos assemblies):
```csharp
[Theory, MemberData(nameof(Modulos))]
public void Domain_nao_depende_de_framework(string m) =>
    Assert.True(Types.InAssembly(Assembly.Load($"{m}.Domain")).ShouldNot()
        .HaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore", "MediatR", $"{m}.Application", $"{m}.Infrastructure")
        .GetResult().IsSuccessful);
```
Regras mínimas: Domain sem EF/ASP.NET/MediatR; Application sem Infrastructure/Api; nenhum módulo referencia outro (exceto `*.Contracts`);
handlers são `internal sealed`; entidades não têm setter público; classes `*Command`/`*Query` são `record`.
Uma falha aqui **bloqueia** a DoD. Para mudar uma regra, é preciso um ADR.
