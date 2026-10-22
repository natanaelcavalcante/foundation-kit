# Padrões comuns às skills (perfil mobile-kotlin)

## Princípio número 1
**O app nunca é a autoridade.** Toda regra de negócio e toda autorização são validadas no backend (perfil web-nextjs ou enterprise-dotnet).
No app, regras existem por UX e para funcionar offline. Um teste de burla de regra é sempre escrito **no backend**.

## Caminhos
| Camada | Caminho |
|---|---|
| Kernel | `mobile/core/domain` (Kotlin puro: `Resultado`, `Falha`, `Entity`, `Id`, `Money`, `Relogio`) |
| Infra transversal | `mobile/core/{network,database,security,ui}` |
| Feature | `mobile/feature/<f>/{domain,data,presentation}` |
| App | `mobile/app` (Application, navegação, DI raiz) |

`feature/*/domain` depende só de `core/domain`. `data` implementa as interfaces de `domain`. `presentation` (Compose + ViewModel) depende de `domain`.
Features não dependem entre si (a navegação passa só IDs).

## Nomes (pt-BR por padrão)
`OrdemServico`, `IniciarOsUseCase`, `OsRepository`, `OsRepositoryImpl`, `ListaOsViewModel`, `ListaOsScreen`, `OsUiState`.
Strings em `res/values/strings.xml` (pt-BR padrão); erros por código: `erro_mecanico_ocupado`.

## Regras que toda skill verifica
1. `core/domain` e `feature/*/domain` sem `android.*`, sem Retrofit/Room.
2. Nada de `Instant.now()`/`System.currentTimeMillis()` em domínio/ViewModel: use `Relogio`.
3. Nada de segredo, token ou PII em log (`Timber` só em debug, com árvore que mascara).
4. Cada `Scenario` mobile da spec tem um teste com o mesmo nome (`` @Test fun `nome do cenário`() ``).
5. `./gradlew test koverVerify detekt ktlintCheck lint` verde; cobertura ≥ 80% em `domain`, `data` e ViewModels.
