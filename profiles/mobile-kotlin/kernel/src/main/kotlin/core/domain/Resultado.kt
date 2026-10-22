package core.domain

/**
 * Resultado de operações que podem falhar de forma esperada (validação, regra, resposta de erro da API).
 * Exceções ficam para o inesperado. Nome `Resultado` para não colidir com `kotlin.Result`.
 */
sealed interface Resultado<out T> {
    data class Sucesso<out T>(val valor: T) : Resultado<T>
    data class Erro(val falhas: List<Falha>) : Resultado<Nothing> {
        init { require(falhas.isNotEmpty()) { "Resultado.Erro exige ao menos uma falha" } }
    }

    val ok: Boolean get() = this is Sucesso
    val codigos: List<String> get() = (this as? Erro)?.falhas?.map { it.codigo } ?: emptyList()

    companion object {
        fun <T> ok(valor: T): Resultado<T> = Sucesso(valor)
        fun falha(vararg falhas: Falha): Resultado<Nothing> = Erro(falhas.toList())
        fun falha(falhas: List<Falha>): Resultado<Nothing> = Erro(falhas)

        /** Agrega todas as falhas (útil para validar vários VOs de uma vez). */
        fun <A, B> combinar(a: Resultado<A>, b: Resultado<B>): Resultado<Pair<A, B>> =
            if (a is Sucesso && b is Sucesso) Sucesso(a.valor to b.valor) else Erro(falhasDe(a) + falhasDe(b))

        private fun falhasDe(r: Resultado<*>) = (r as? Erro)?.falhas ?: emptyList()
    }
}

inline fun <T, R> Resultado<T>.map(fn: (T) -> R): Resultado<R> = when (this) {
    is Resultado.Sucesso -> Resultado.Sucesso(fn(valor))
    is Resultado.Erro -> this
}

inline fun <T, R> Resultado<T>.flatMap(fn: (T) -> Resultado<R>): Resultado<R> = when (this) {
    is Resultado.Sucesso -> fn(valor)
    is Resultado.Erro -> this
}

/** Valor do sucesso. Lança se for erro — use só onde o sucesso já foi verificado (ex.: testes). */
fun <T> Resultado<T>.valorOuLanca(): T = when (this) {
    is Resultado.Sucesso -> valor
    is Resultado.Erro -> error("Acesso a valor de Resultado com falha: ${falhas.joinToString { it.codigo }}")
}
