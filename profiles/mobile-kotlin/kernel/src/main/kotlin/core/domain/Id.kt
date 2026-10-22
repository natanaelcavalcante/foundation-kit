package core.domain

import java.util.UUID

@JvmInline
value class Id private constructor(val valor: String) {
    override fun toString() = valor

    companion object {
        fun novo(): Id = Id(UUID.randomUUID().toString())

        fun criar(bruto: String?, campo: String = "id"): Resultado<Id> {
            val uuid = bruto?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            return if (uuid == null || uuid.toString() != bruto.lowercase()) Resultado.falha(Falha.validacao("ID_INVALIDO", campo))
            else Resultado.ok(Id(uuid.toString()))
        }
    }
}
