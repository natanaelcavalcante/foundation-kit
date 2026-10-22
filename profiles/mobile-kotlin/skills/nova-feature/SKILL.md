---
name: nova-feature
description: Cria o scaffold de uma feature no perfil mobile-kotlin (módulos domain/data/presentation, DI Hilt, rota de navegação) a partir de uma spec OpenSpec aprovada que tenha a seção Mobile. Usar ao iniciar uma funcionalidade do app na Fase 4.
---

# Nova feature (app)

**Pré-condição:** spec aprovada (`state.json`) **e** o módulo correspondente já pronto no backend (com o contrato da API estável).

1. Crie `feature/<f>/domain` (jvm library), `feature/<f>/data` e `feature/<f>/presentation` (android library) com os convention plugins.
2. `domain`: modelos (skill `modelo-dominio`), interface `<F>Repository`, use cases (skill `use-case`).
3. `data`: DTOs `@Serializable` espelhando a API, `<F>Api` (Retrofit), `<F>Dao` + entidades Room se houver offline, `<F>RepositoryImpl` (skill `repositorio`), `@Module` Hilt.
4. `presentation`: `UiState`, `ViewModel`, `Screen` (skill `tela`), rota tipada (`@Serializable data class DetalheOsRota(val osId: String)`).
5. Registre a rota no `NavHost` do `app`. A tela só aparece se o usuário tiver a permissão (lida do perfil retornado pela API); o backend valida de novo.
6. Tasks em `openspec/changes/<f>/tasks.md`, na ordem domain → data → presentation → E2E (Maestro).
