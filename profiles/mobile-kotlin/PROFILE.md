# Perfil: mobile-kotlin

**Quando:** aplicativo nativo Android (e iOS via Kotlin Multiplatform, quando definido no brief).
**Sempre combinado com um perfil de backend** (`web-nextjs` para a API, ou `enterprise-dotnet`), registrado em ADR.
O app nunca é a fonte da verdade das regras: **toda regra de negócio é reforçada no backend**.

## Stack
| Camada | Escolha |
|---|---|
| Linguagem/UI | **Kotlin**, **Jetpack Compose** + Material 3; KMP + Compose Multiplatform se houver iOS (ADR) |
| Arquitetura | Clean Architecture por feature + **MVVM/MVI** (ViewModel + StateFlow), UDF |
| DI | **Hilt** (Android) ou **Koin** (KMP) |
| Rede | **Retrofit + OkHttp** (ou Ktor Client no KMP), kotlinx.serialization, **certificate pinning** |
| Local | **Room** (ou SQLDelight no KMP) cifrado com **SQLCipher**; DataStore |
| Segredos no dispositivo | **Android Keystore** + **Tink** (AEAD) sobre DataStore — `security-crypto`/EncryptedSharedPreferences foi descontinuado |
| Auth | Fluxo de referência do kit (TOTP obrigatório no 1º acesso, código por e-mail, recuperação) consumindo o identity do backend — skill `autenticacao-app`; refresh rotativo; **biometria** para desbloqueio local |
| Offline | Room como cache + sincronização com WorkManager (quando o brief exigir) |
| Hardening | R8/ProGuard, Play Integrity API, detecção de root (alerta, não bloqueio cego), `FLAG_SECURE` em telas sensíveis, sem logs em release |
| i18n | `strings.xml` por locale (pt-BR padrão) |
| Testes | **JUnit5 + MockK + Turbine** (Flows), **Kover** (cobertura), **Compose UI Test**, **Maestro** ou Espresso (E2E), MockWebServer |
| Qualidade | ktlint, detekt, Android Lint, OWASP Dependency-Check, MobSF no CI |
| Build/CI | Gradle (version catalogs), build em container Docker; distribuição via Firebase App Distribution / Play Internal |

## Estrutura
```
/
├── backend/                 # perfil de backend escolhido (estrutura própria)
├── mobile/
│   ├── app/                  # entrypoint, navegação, DI
│   ├── core/{domain,data,ui,security,network,database}/
│   └── feature/<modulo>/{domain,data,presentation}/
├── docker-compose.yml        # backend completo + emulador/CI opcional
├── openspec/ docs/ .foundation/
```
Os specs de módulo têm uma seção **Mobile** (telas, estados offline, permissões do SO). Os cenários de burla são testados **no backend**.

## Comandos padrão
`./gradlew test koverVerify detekt ktlintCheck` · `./gradlew connectedAndroidTest` · `maestro test flows/`
