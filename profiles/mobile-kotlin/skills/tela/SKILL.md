---
name: tela
description: Cria ou revisa telas do app no perfil mobile-kotlin — Screen Compose stateless + ViewModel com StateFlow<UiState> e eventos, tratamento de carregando/vazio/erro, mensagens por código de falha, acessibilidade e FLAG_SECURE em telas sensíveis. Usar ao construir a UI de uma feature.
---

# Tela (Compose + ViewModel)

```kotlin
data class PausarOsUiState(val motivo: String = "", val enviando: Boolean = false, val erro: Falha? = null, val concluido: Boolean = false)

@HiltViewModel
class PausarOsViewModel @Inject constructor(private val pausar: PausarOsUseCase, salvo: SavedStateHandle) : ViewModel() {
    private val osId = Id.criar(salvo.toRoute<PausarOsRota>().osId).valorOuLanca()
    private val _estado = MutableStateFlow(PausarOsUiState())
    val estado = _estado.asStateFlow()

    fun alterarMotivo(v: String) = _estado.update { it.copy(motivo = v, erro = null) }
    fun enviar() {
        if (_estado.value.enviando) return // evita toque duplo
        _estado.update { it.copy(enviando = true) }
        viewModelScope.launch {
            when (val r = pausar(osId, _estado.value.motivo)) {
                is Resultado.Sucesso -> _estado.update { it.copy(enviando = false, concluido = true) }
                is Resultado.Erro -> _estado.update { it.copy(enviando = false, erro = r.falhas.first()) }
            }
        }
    }
}
```
- A `Screen` recebe `estado` + lambdas (stateless) e o `Route` composable liga ao ViewModel com `collectAsStateWithLifecycle()`.
- Erro → `stringResource(mensagemPara(falha.codigo))`: um mapa código → `R.string.erro_*`, com fallback genérico. `REDE` → "Sem conexão" + tentar de novo.
- Estados obrigatórios: carregando (skeleton), vazio, erro e conteúdo. `contentDescription` em ícones, alvos de 48dp, suporte a fonte grande.
- Telas de login, MFA e dados sensíveis: `window.setFlags(FLAG_SECURE)` (impede screenshot e prévia no multitarefa).

## Testes
ViewModel com Turbine (sequência de estados: inicial → enviando → concluído/erro; toque duplo não envia duas vezes) e Compose UI test
(campo, botão desabilitado ao enviar, mensagem de erro exibida).
