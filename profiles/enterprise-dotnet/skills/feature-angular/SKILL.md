---
name: feature-angular
description: Cria ou revisa features do frontend Angular no perfil enterprise-dotnet — rotas lazy, guard de permissão, serviço HTTP tipado, componentes standalone com signals, reactive forms tipados, mapeamento de erros da API (codigo/campo) e i18n. Usar ao construir a UI de um módulo.
---

# Feature Angular

## Estrutura `web/src/app/features/<m>/`
`<m>.routes.ts` (lazy, `canMatch: [permissaoGuard('os:ler')]`), `data/<m>.api.ts` (HttpClient tipado com DTOs espelhando a API),
`pages/` (componentes de rota), `components/` (apresentação), `i18n/pt-BR.json`.

## Regras
- Componentes standalone, `ChangeDetectionStrategy.OnPush`, estado com `signal`/`computed`; `toSignal` para observables.
- Formulários: `FormBuilder.nonNullable` tipado; validators espelham a spec (UX), mas o servidor é a lei.
- Erros: o interceptor converte ProblemDetails em `{ codigo, campo }`; o form aplica `control.setErrors({ servidor: codigo })` e o template mostra `('erros.' + codigo) | translate`.
- A diretiva `*temPermissao="'os:iniciar'"` esconde ações (cosmético; o servidor valida).
- Toda lista tem estados vazio, carregando e erro; ações destrutivas pedem confirmação (MatDialog); botão desabilitado durante o envio.
- Sem token em localStorage: a autenticação é por cookie HttpOnly (`withCredentials`) + header anti-CSRF.

## Testes
Jest/Karma para serviços, guards e componentes com regra; Playwright E2E do fluxo principal (incluindo o erro de regra vindo da API e a ausência de ações sem permissão) + `@axe-core/playwright`.
