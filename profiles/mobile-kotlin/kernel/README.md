# Kernel (mobile/core/domain)

Primitivas de domínio do app, em Kotlin puro (sem Android), copiadas para `mobile/core/domain` na Fase 3.
Mesmo desenho dos kernels web-nextjs e .NET: `Resultado`/`Falha` (mesmos códigos e tipos que a API devolve), `Entity`,
`Id`, `Money` em centavos, `Pagina` e portas (`Relogio`).

`gradle test koverVerify` → deve passar com 100% de cobertura de linhas.
