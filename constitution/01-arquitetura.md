# Constituição 01 — Arquitetura

## Separação e modularização
- **Frontend e backend separados por fronteira clara** (projetos distintos, ou camadas distintas no mesmo
  projeto quando o perfil for full-stack, como o Next.js). O front nunca acessa o banco diretamente.
- O sistema é dividido em **módulos por bounded context** (DDD). Cada módulo tem:
  - **Domínio** (entidades, value objects, serviços de domínio, eventos): puro, sem framework, sem I/O.
  - **Aplicação** (casos de uso, DTOs, portas/interfaces de repositório e query).
  - **Infraestrutura** (ORM, HTTP, filas, storage): implementa as portas.
  - **Interface** (controllers/rotas, telas).
- Dependências apontam **para dentro**: interface → aplicação → domínio. O domínio não conhece nada de fora.
- Um módulo **não acessa o banco de outro módulo**. A comunicação acontece por casos de uso públicos,
  eventos ou queries expostas.
- Código compartilhado (`shared`) contém apenas primitivas genuinamente transversais: `Result`, erros base,
  `Entity`, `ValueObject`, `Money`, paginação. Regra de negócio nunca vai para `shared`.

## DDD
- **Entidades** protegem suas invariantes: é impossível construir ou mutar uma entidade em estado inválido.
- **Value Objects** são imutáveis e se validam na criação (Email, CPF/CNPJ, Money, Placa...).
- **Agregados** definem as fronteiras de consistência transacional; o repositório opera por agregado raiz.
- **CQRS leve**: escrita via repositório + entidade; leitura via query/projeção otimizada que retorna DTO.
- **Linguagem ubíqua**: os nomes no código refletem os termos do negócio, registrados no glossário do brief.

## SOLID / DRY / KISS
- **S**: uma classe, uma razão para mudar; um caso de uso, uma intenção do usuário.
- **O/L**: estender por composição e interfaces, não por `if` de tipo.
- **I**: portas pequenas e específicas (`FindOsByIdQuery`, e não `OsGodRepository`).
- **D**: casos de uso dependem de interfaces, e as implementações são injetadas.
- **DRY** vale para *conhecimento*, não para coincidência de código: não acople módulos para economizar três linhas.
- **YAGNI**: nada de abstração especulativa.

## Tratamento de erros
- O domínio e a aplicação retornam `Result<T, Erro>` (ou o equivalente da stack) para falhas esperadas.
  Exceções ficam só para falhas inesperadas.
- Os erros têm código estável (`OS_MECANICO_OCUPADO`) e mensagem; a camada de interface mapeia código → HTTP/UI.

## Decisões
- Toda decisão arquitetural relevante vira um **ADR** em `docs/adr/` (template em `templates/ADR.md`).
