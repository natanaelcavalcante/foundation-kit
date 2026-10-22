package core.domain

import java.time.Instant

data class EventoDominio(val nome: String, val ocorridoEm: Instant, val dados: Map<String, Any?>)

/**
 * Entidade: identidade + invariantes. No app, entidades existem para regras que precisam valer offline
 * (o backend continua sendo a autoridade e revalida tudo). Estado muda só por métodos que retornam [Resultado].
 */
abstract class Entity(val id: Id) {
    private val eventos = mutableListOf<EventoDominio>()

    protected fun registrar(nome: String, ocorridoEm: Instant, dados: Map<String, Any?>) {
        eventos += EventoDominio(nome, ocorridoEm, dados)
    }

    fun extrairEventos(): List<EventoDominio> = eventos.toList().also { eventos.clear() }

    final override fun equals(other: Any?) = other is Entity && other::class == this::class && other.id == id
    final override fun hashCode() = 31 * this::class.hashCode() + id.hashCode()
}
