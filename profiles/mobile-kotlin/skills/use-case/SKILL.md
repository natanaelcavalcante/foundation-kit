---
name: use-case
description: Cria ou revisa use cases do app no perfil mobile-kotlin — classes com operator fun invoke suspend que orquestram repositórios e validações locais retornando Resultado. Usar para cada ação do usuário na feature.
---

# Use case (app)

```kotlin
class PausarOsUseCase @Inject constructor(private val repo: OsRepository) {
    suspend operator fun invoke(osId: Id, motivo: String): Resultado<Os> =
        Justificativa.criar(motivo).flatMap { repo.pausar(osId, it) } // validação local por UX; o backend é a autoridade
}
```
- Um use case = uma ação. Dependências por construtor (Hilt). Sem `Dispatchers` hardcoded: o repositório usa um `CoroutineDispatcher` injetado.
- Não captura exceções genéricas: o repositório já converte erro de rede/API em `Resultado.Erro`.
- Sem estado. Fluxos contínuos (`Flow<List<Os>>`) vêm do repositório (Room como fonte da verdade da UI).

## Testes
JUnit5 + MockK (ou fakes): sucesso, validação local falhando **sem chamar** o repositório, erro do repositório propagado.
