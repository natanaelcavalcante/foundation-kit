package core.domain

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.NumberFormat
import java.util.Locale

/** Dinheiro em centavos inteiros (nunca Double). Formatação por locale só na UI. */
@JvmInline
value class Money private constructor(val centavos: Long) {
    operator fun plus(outro: Money) = Money(Math.addExact(centavos, outro.centavos))

    fun multiplicar(quantidade: BigDecimal) = Money(arredondar(BigDecimal(centavos) * quantidade))

    /** Aplica percentual (0–100), meio centavo para cima. */
    fun percentual(p: BigDecimal) = Money((BigDecimal(centavos) * p).divide(BigDecimal(100), 0, RoundingMode.HALF_UP).longValueExact())

    fun subtrair(outro: Money): Resultado<Money> =
        if (outro.centavos > centavos) Resultado.falha(Falha.regra("VALOR_NEGATIVO")) else Resultado.ok(Money(centavos - outro.centavos))

    fun formatar(locale: Locale = Locale.forLanguageTag("pt-BR")): String =
        NumberFormat.getCurrencyInstance(locale).format(BigDecimal(centavos).movePointLeft(2))

    companion object {
        val ZERO = Money(0)

        fun deCentavos(centavos: Long, campo: String = "valor"): Resultado<Money> =
            if (centavos < 0) Resultado.falha(Falha.validacao("VALOR_NEGATIVO", campo)) else Resultado.ok(Money(centavos))

        private fun arredondar(v: BigDecimal) = v.setScale(0, RoundingMode.HALF_UP).longValueExact()
    }
}
