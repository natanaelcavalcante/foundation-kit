package core.domain

/** Mesmas categorias da API: o app traduz falhas do servidor e do domínio local da mesma forma. */
enum class TipoFalha { VALIDACAO, REGRA_NEGOCIO, NAO_ENCONTRADO, CONFLITO, NAO_AUTENTICADO, PROIBIDO, LIMITE_EXCEDIDO, REDE }

/** [codigo] é estável (SCREAMING_SNAKE_CASE) e vira chave de string resource: `erro_<codigo minúsculo>`. */
data class Falha(
    val codigo: String,
    val tipo: TipoFalha,
    val campo: String? = null,
    val detalhes: Map<String, Any?> = emptyMap(),
) {
    companion object {
        fun validacao(codigo: String, campo: String? = null) = Falha(codigo, TipoFalha.VALIDACAO, campo)
        fun regra(codigo: String) = Falha(codigo, TipoFalha.REGRA_NEGOCIO)

        /** Converte o status HTTP de um ProblemDetails/erro da API quando o corpo não traz o tipo. */
        fun tipoDoHttp(status: Int): TipoFalha = when (status) {
            400, 422 -> TipoFalha.VALIDACAO
            401 -> TipoFalha.NAO_AUTENTICADO
            403 -> TipoFalha.PROIBIDO
            404 -> TipoFalha.NAO_ENCONTRADO
            409 -> TipoFalha.CONFLITO
            429 -> TipoFalha.LIMITE_EXCEDIDO
            else -> TipoFalha.REDE
        }
    }
}
