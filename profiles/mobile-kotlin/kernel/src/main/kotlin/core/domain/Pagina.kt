package core.domain

import java.time.Instant

data class PaginaEntrada(val pagina: Int, val tamanho: Int) {
    companion object {
        const val TAMANHO_MAXIMO = 100
        fun normalizar(pagina: Int? = null, tamanho: Int? = null) =
            PaginaEntrada(maxOf(1, pagina ?: 1), (tamanho ?: 20).coerceIn(1, TAMANHO_MAXIMO))
    }
}

data class Pagina<T>(val itens: List<T>, val total: Int, val pagina: Int, val tamanho: Int) {
    val temProxima: Boolean get() = pagina * tamanho < total
}

/** Abstrai o tempo para testes determinísticos. Nunca use `Instant.now()` no domínio/ViewModel. */
fun interface Relogio {
    fun agora(): Instant
}
