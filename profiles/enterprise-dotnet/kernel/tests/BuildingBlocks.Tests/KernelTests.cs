using BuildingBlocks;

namespace BuildingBlocks.Tests;

public class ResultTests
{
    private static readonly Falha F = Falha.Validacao("X");

    [Fact]
    public void Sucesso_expoe_valor()
    {
        Result<int> r = 1;
        Assert.True(r.Ok);
        Assert.False(r.Falhou);
        Assert.Equal(1, r.Valor);
        Assert.Empty(r.Codigos);
    }

    [Fact]
    public void Falha_guarda_codigos_e_acesso_ao_valor_lanca()
    {
        Result<int> r = F;
        Assert.True(r.Falhou);
        Assert.Equal(["X"], r.Codigos);
        Assert.Throws<InvalidOperationException>(() => r.Valor);
        Assert.Throws<ArgumentException>(() => Result<int>.Falha([]));
    }

    [Fact]
    public void Combinar_agrega_todas_as_falhas()
    {
        Assert.Equal(["X", "Y"], Result.Combinar(Result<int>.Falha(F), Result<string>.Falha(Falha.Validacao("Y"))).Codigos);
        Assert.Equal((1, "a"), Result.Combinar<int, string>(1, "a").Valor);
        Assert.Equal((1, "a", true), Result.Combinar<int, string, bool>(1, "a", true).Valor);
        Assert.Equal(["X"], Result.Combinar<int, string, bool>(1, "a", F).Codigos);
    }

    [Fact]
    public void Map_e_Bind_curto_circuitam()
    {
        Result<int> ok = 2;
        Result<int> falha = F;
        Assert.Equal(4, ok.Map(v => v * 2).Valor);
        Assert.Equal(3, ok.Bind<int>(v => v + 1).Valor);
        Assert.Equal(["X"], falha.Map(v => v * 2).Codigos);
        Assert.Equal(["X"], falha.Bind<int>(v => v).Codigos);
        Assert.True(Result.Sucesso().Ok);
        Assert.Equal(["X"], Result.Falha(F).Codigos);
    }

    [Theory]
    [InlineData(TipoFalha.Validacao, 422)]
    [InlineData(TipoFalha.RegraNegocio, 422)]
    [InlineData(TipoFalha.NaoEncontrado, 404)]
    [InlineData(TipoFalha.Conflito, 409)]
    [InlineData(TipoFalha.NaoAutenticado, 401)]
    [InlineData(TipoFalha.Proibido, 403)]
    [InlineData(TipoFalha.LimiteExcedido, 429)]
    [InlineData((TipoFalha)99, 500)]
    public void Tipo_mapeia_para_http(TipoFalha tipo, int status) => Assert.Equal(status, new Falha("A", tipo).StatusHttp);

    [Fact]
    public void Fabricas_de_falha()
    {
        Assert.Equal(TipoFalha.RegraNegocio, Falha.Regra("R").Tipo);
        Assert.Equal(TipoFalha.NaoEncontrado, Falha.NaoEncontrado("N").Tipo);
        Assert.Equal(TipoFalha.Conflito, Falha.Conflito("C").Tipo);
        Assert.Equal("ACESSO_NEGADO", Falha.Proibido().Codigo);
        Assert.Equal("campo", Falha.Validacao("V", "campo").Campo);
    }
}

public class IdEntityTests
{
    private sealed class Coisa(Id id) : Entity(id)
    {
        public void Renomear(DateTimeOffset em) => Registrar("CoisaRenomeada", em, new Dictionary<string, object?> { ["x"] = 1 });
    }

    private sealed class Outra(Id id) : Entity(id);

    [Fact]
    public void Id_valida_e_e_igual_por_valor()
    {
        var id = Id.Novo();
        Assert.Equal(id, Id.Criar(id.ToString()).Valor);
        Assert.Equal(["ID_INVALIDO"], Id.Criar("abc").Codigos);
        Assert.Equal(["ID_INVALIDO"], Id.Criar(Guid.Empty.ToString()).Codigos);
        Assert.Equal(["ID_INVALIDO"], Id.Criar(null).Codigos);
        Assert.Equal(id, Id.De(id.Valor));
        Assert.Throws<ArgumentException>(() => Id.De(Guid.Empty));
    }

    [Fact]
    public void Entidade_igual_por_id_e_tipo_e_eventos_extraidos_uma_vez()
    {
        var id = Id.Novo();
        var c = new Coisa(id);
        Assert.Equal(c, new Coisa(id));
        Assert.Equal(c.GetHashCode(), new Coisa(id).GetHashCode());
        Assert.NotEqual<Entity>(c, new Outra(id));
        Assert.NotEqual(c, new Coisa(Id.Novo()));
        Assert.False(c.Equals(null));
        c.Renomear(DateTimeOffset.UnixEpoch);
        Assert.Equal("CoisaRenomeada", Assert.Single(c.ExtrairEventos()).Nome);
        Assert.Empty(c.ExtrairEventos());
    }
}

public class MoneyContextoPaginaTests
{
    private static Money M(long c) => Money.DeCentavos(c).Valor;

    [Fact]
    public void Money_opera_em_centavos()
    {
        Assert.Equal(["VALOR_NEGATIVO"], Money.DeCentavos(-1).Codigos);
        Assert.Equal(0, Money.Zero.Centavos);
        Assert.Equal(101, M(100).Somar(M(1)).Centavos);
        Assert.Equal(999, M(333).Multiplicar(3).Centavos);
        Assert.Equal(101, M(1005).Percentual(10).Centavos);
        Assert.Equal(60, M(100).Subtrair(M(40)).Valor.Centavos);
        Assert.Equal(["VALOR_NEGATIVO"], M(100).Subtrair(M(101)).Codigos);
        Assert.Equal(M(5), M(5));
    }

    [Fact]
    public void ExigirPermissao()
    {
        var ctx = new ContextoExecucao(Guid.NewGuid(), Guid.NewGuid(), new HashSet<string> { "os:iniciar" }, "t");
        Assert.True(ctx.ExigirPermissao("os:iniciar").Ok);
        var r = ctx.ExigirPermissao("os:excluir");
        Assert.Equal(TipoFalha.Proibido, Assert.Single(r.Falhas).Tipo);
    }

    [Fact]
    public void Paginacao_limita_valores()
    {
        Assert.Equal(new PaginaEntrada(1, 20), PaginaEntrada.Normalizar());
        Assert.Equal(new PaginaEntrada(1, 100), PaginaEntrada.Normalizar(-3, 9999));
        Assert.Equal(new PaginaEntrada(2, 1), PaginaEntrada.Normalizar(2, 0));
        Assert.Equal(10, new PaginaEntrada(3, 5).Pular);
    }
}
