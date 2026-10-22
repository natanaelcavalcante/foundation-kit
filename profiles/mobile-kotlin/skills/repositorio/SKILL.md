---
name: repositorio
description: Cria ou revisa repositórios do app no perfil mobile-kotlin — implementação que combina API (Retrofit) e cache local (Room + SQLCipher), converte erros em Falha, estratégia offline-first opcional com sincronização por WorkManager. Usar ao conectar uma feature ao backend.
---

# Repositório (app)

```kotlin
class OsRepositoryImpl @Inject constructor(
    private val api: OsApi, private val dao: OsDao, private val chamada: ChamadaSegura, // core:network
    @IoDispatcher private val io: CoroutineDispatcher,
) : OsRepository {
    override fun observar(): Flow<List<Os>> = dao.observarTodas().map { it.map(OsEntity::paraDominio) }
    override suspend fun pausar(id: Id, j: Justificativa) = withContext(io) {
        chamada { api.pausar(id.valor, PausarBody(j.valor)) }.map { dto -> dao.salvar(dto.paraEntity()); dto.paraDominio() }
    }
}
```
- `ChamadaSegura` (core:network) executa a chamada e converte: HTTP de erro → `Falha(codigo, tipo, campo)` do corpo; `IOException` → `REDE`; 401 após o refresh falhar → evento global de logout.
- O cache Room guarda **só o necessário** para a tela/offline, no banco cifrado (SQLCipher, chave no Keystore). Limpar tudo no logout.
- Offline-first (quando o brief exigir): grave localmente com `pendenteSync = true`, `WorkManager` com constraint de rede envia, e conflitos (409) viram estado visível ao usuário. Nunca resolva conflito silenciosamente.
- Nunca envie `tenantId`/`usuarioId` no body: o backend usa o token.

## Testes
MockWebServer (respostas de sucesso, 401, 403, 404, 409 com `codigo`, 500, timeout) + Room in-memory (Robolectric ou teste instrumentado):
mapeamento DTO↔domínio, conversão de cada erro em `Falha`, cache atualizado, limpeza no logout.
