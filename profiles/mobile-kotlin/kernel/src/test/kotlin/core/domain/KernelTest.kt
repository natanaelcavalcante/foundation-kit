package core.domain

import java.math.BigDecimal
import java.time.Instant
import java.util.Locale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class ResultadoTest {
    private val f = Falha.validacao("X")

    @Test fun `sucesso e erro`() {
        val ok = Resultado.ok(1)
        assertTrue(ok.ok)
        assertEquals(emptyList(), ok.codigos)
        assertEquals(1, ok.valorOuLanca())
        val erro = Resultado.falha(f)
        assertFalse(erro.ok)
        assertEquals(listOf("X"), erro.codigos)
        assertFailsWith<IllegalStateException> { erro.valorOuLanca() }
        assertFailsWith<IllegalArgumentException> { Resultado.falha(emptyList()) }
    }

    @Test fun `combinar agrega todas as falhas`() {
        assertEquals(listOf("X", "Y"), Resultado.combinar(Resultado.falha(f), Resultado.falha(Falha.validacao("Y"))).codigos)
        assertEquals(listOf("X"), Resultado.combinar(Resultado.ok(1), Resultado.falha(f)).codigos)
        assertEquals(1 to "a", Resultado.combinar(Resultado.ok(1), Resultado.ok("a")).valorOuLanca())
    }

    @Test fun `map e flatMap curto-circuitam`() {
        assertEquals(4, Resultado.ok(2).map { it * 2 }.valorOuLanca())
        assertEquals(3, Resultado.ok(2).flatMap { Resultado.ok(it + 1) }.valorOuLanca())
        val erro: Resultado<Int> = Resultado.falha(f)
        assertEquals(listOf("X"), erro.map { it * 2 }.codigos)
        assertEquals(listOf("X"), erro.flatMap { Resultado.ok(it) }.codigos)
    }

    @Test fun `tipo a partir do http e fabricas`() {
        mapOf(400 to TipoFalha.VALIDACAO, 422 to TipoFalha.VALIDACAO, 401 to TipoFalha.NAO_AUTENTICADO, 403 to TipoFalha.PROIBIDO,
            404 to TipoFalha.NAO_ENCONTRADO, 409 to TipoFalha.CONFLITO, 429 to TipoFalha.LIMITE_EXCEDIDO, 503 to TipoFalha.REDE)
            .forEach { (status, tipo) -> assertEquals(tipo, Falha.tipoDoHttp(status)) }
        assertEquals(TipoFalha.REGRA_NEGOCIO, Falha.regra("R").tipo)
        assertEquals("c", Falha.validacao("V", "c").campo)
    }
}

class IdEntityTest {
    private class Coisa(id: Id) : Entity(id) {
        fun renomear(em: Instant) = registrar("CoisaRenomeada", em, mapOf("x" to 1))
    }
    private class Outra(id: Id) : Entity(id)

    @Test fun `id valida formato e normaliza`() {
        val id = Id.novo()
        assertEquals(id, Id.criar(id.valor).valorOuLanca())
        assertEquals(id.valor, Id.criar(id.valor.uppercase()).valorOuLanca().toString())
        assertEquals(listOf("ID_INVALIDO"), Id.criar("abc").codigos)
        assertEquals(listOf("ID_INVALIDO"), Id.criar("1-1-1-1-1").codigos)
        assertEquals(listOf("ID_INVALIDO"), Id.criar(null).codigos)
    }

    @Test fun `entidade igual por id e tipo, eventos extraidos uma vez`() {
        val id = Id.novo()
        val c = Coisa(id)
        assertEquals<Entity>(c, Coisa(id))
        assertEquals(c.hashCode(), Coisa(id).hashCode())
        assertNotEquals<Entity>(c, Outra(id))
        assertNotEquals<Entity>(c, Coisa(Id.novo()))
        assertFalse(c.equals(null))
        c.renomear(Instant.EPOCH)
        assertEquals("CoisaRenomeada", c.extrairEventos().single().nome)
        assertTrue(c.extrairEventos().isEmpty())
    }
}

class MoneyPaginaTest {
    private fun m(c: Long) = Money.deCentavos(c).valorOuLanca()

    @Test fun `money em centavos`() {
        assertEquals(listOf("VALOR_NEGATIVO"), Money.deCentavos(-1).codigos)
        assertEquals(0, Money.ZERO.centavos)
        assertEquals(101, (m(100) + m(1)).centavos)
        assertEquals(999, m(333).multiplicar(BigDecimal(3)).centavos)
        assertEquals(101, m(1005).percentual(BigDecimal(10)).centavos)
        assertEquals(60, m(100).subtrair(m(40)).valorOuLanca().centavos)
        assertEquals(listOf("VALOR_NEGATIVO"), m(100).subtrair(m(101)).codigos)
        assertEquals("R\$ 12,34", m(1234).formatar().replace(' ', ' '))
        assertEquals("$12.34", m(1234).formatar(Locale.US))
        assertFailsWith<ArithmeticException> { m(Long.MAX_VALUE) + m(1) }
    }

    @Test fun `paginacao e relogio`() {
        assertEquals(PaginaEntrada(1, 20), PaginaEntrada.normalizar())
        assertEquals(PaginaEntrada(1, 100), PaginaEntrada.normalizar(-3, 9999))
        assertEquals(PaginaEntrada(2, 1), PaginaEntrada.normalizar(2, 0))
        assertTrue(Pagina(listOf(1), total = 3, pagina = 1, tamanho = 1).temProxima)
        assertFalse(Pagina(listOf(1), total = 1, pagina = 1, tamanho = 1).temProxima)
        assertEquals(Instant.EPOCH, Relogio { Instant.EPOCH }.agora())
    }
}
