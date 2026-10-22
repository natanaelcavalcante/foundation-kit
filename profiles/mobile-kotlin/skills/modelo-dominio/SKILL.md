---
name: modelo-dominio
description: Cria ou revisa modelos de domínio do app no perfil mobile-kotlin — value classes validadas, data classes imutáveis e entidades com Resultado, usadas para validar formulários e regras offline. Usar ao modelar conceitos da feature no app.
---

# Modelo de domínio (app)

- VO: `@JvmInline value class Placa private constructor(val valor: String)` + `companion object { fun criar(bruto: String?): Resultado<Placa> }`, normalizando.
- **Os mesmos códigos de falha da API** (`PLACA_INVALIDA`): o form mostra a mesma mensagem, venha o erro do app ou do servidor.
- Modelos de leitura: `data class` imutável (`val`), sem lógica além de propriedades derivadas.
- Entidade (herda `Entity`) só quando há regra offline real, por exemplo um apontamento de horas registrado sem rede e sincronizado depois.
  Os métodos retornam `Resultado`, e o backend revalida na sincronização.
- Sem `android.*` nesses módulos.

## Testes (JUnit5)
Válidos/inválidos com `@ParameterizedTest`, normalização, igualdade, transições (se for entidade) e a falha não altera o estado.
