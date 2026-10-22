---
name: config-projeto
description: Faz o scaffold inicial (Fase 3) de um app no perfil mobile-kotlin — projeto Gradle multi-módulo (app, core/*, feature/*) com version catalog, Compose, Hilt, Retrofit/OkHttp, Room+SQLCipher, Kover, detekt, ktlint, build em Docker e CI; junto com o backend do perfil escolhido. Usar ao iniciar a fundação de um aplicativo.
---

# Scaffold do app (mobile-kotlin)

**Pré-condição:** o ADR define o perfil do backend. Faça primeiro o `config-projeto` daquele perfil em `backend/`.

## Passos
1. `mobile/settings.gradle.kts` com os módulos `:app`, `:core:domain`, `:core:network`, `:core:database`, `:core:security`, `:core:ui`.
2. `gradle/libs.versions.toml` (version catalog) com Kotlin 2.x, AGP, Compose BOM, Hilt, Retrofit, OkHttp, kotlinx.serialization, Room,
   SQLCipher (`net.zetetic:sqlcipher-android`), Tink, Biometric, WorkManager, Timber, JUnit5, MockK, Turbine, Kover, detekt, ktlint.
   Use as versões estáveis mais recentes.
3. Convention plugins em `mobile/build-logic/` (`app.android.library`, `app.android.feature`, `app.jvm.library`) para não repetir configuração.
4. `:core:domain`: copie `.foundation/profiles/mobile-kotlin/kernel/src` e os testes. `./gradlew :core:domain:test` deve passar com 100%.
5. `:core:network`: OkHttp com **certificate pinning** (pins do certificado intermediário + backup), interceptor de autenticação (token do
   `ArmazenamentoSeguro`), authenticator de refresh (rotativo, uma requisição de refresh por vez — `Mutex`), conversor de erro da API → `Falha`
   (lê `codigo`/`campo` do ProblemDetails/JSON; usa `Falha.tipoDoHttp` como fallback; `IOException` → `TipoFalha.REDE`).
   O `HttpLoggingInterceptor` só existe no build debug e oculta o header `Authorization`.
6. `:core:security`: skill `armazenamento-seguro`. `:core:database`: Room com SQLCipher (skill `repositorio`).
7. `app`: `android:allowBackup="false"`, `usesCleartextTraffic="false"`, `network_security_config.xml` sem CAs de usuário em release;
   R8 com `minifyEnabled` + `shrinkResources`; `FLAG_SECURE` nas telas de login/MFA/dados sensíveis.
8. Qualidade: detekt + ktlint + Android Lint (`warningsAsErrors`), Kover com `minBound(80)` nos módulos de domain/data/presentation.
9. Docker: `mobile/Dockerfile` baseado em uma imagem com Android SDK de linha de comando (para CI e builds reprodutíveis); o
   `docker-compose.yml` da raiz sobe o backend completo + Mailpit para os testes E2E do app.
10. CI: `./gradlew detekt ktlintCheck lint test koverVerify assembleRelease` + OWASP Dependency-Check + MobSF (análise estática do APK);
    E2E com Maestro num emulador contra o backend do compose.
11. Copie as skills do perfil para `.claude/skills/`.
