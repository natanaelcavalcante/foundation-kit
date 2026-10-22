# Fase 1 — Discovery

**Objetivo:** transformar a ideia do responsável em um `docs/PROJECT_BRIEF.md` (template `templates/PROJECT_BRIEF.md`).

## Como conduzir
- Peça primeiro a descrição livre: "Me conte a ideia do projeto e as regras de negócio principais."
- Depois, faça as perguntas abaixo **em blocos de no máximo 5**, pulando as que a descrição já respondeu.
  Proponha uma resposta-padrão sempre que houver uma razoável ("Sugiro X — confirma?").
- Para **cada regra de negócio**, devolva-a reescrita de forma testável (com quando/então) e confirme.
  Pergunte os casos de borda: "E se o mecânico fechar o navegador com a OS em andamento?"
- Monte o **glossário** (linguagem ubíqua) à medida que surgirem termos.

## Roteiro de perguntas

### A. Negócio
1. Qual problema o sistema resolve e para quem? Qual o resultado de sucesso em 6 meses?
2. Quem são os **atores** (papéis)? O que cada um pode e não pode fazer?
3. Quais são as **entidades centrais** e o ciclo de vida de cada uma (estados e transições)?
4. Quais são as **regras de negócio** inegociáveis? Quais as exceções e quem pode autorizá-las?
5. O que é MVP e o que fica para depois?
6. Existe processo manual/planilha atual? Haverá migração de dados?

### B. Usuários e acesso
7. Multi-empresa (**multi-tenant**)? Um usuário pode pertencer a mais de uma empresa?
8. Cadastro aberto, por convite ou só pelo admin? Login social (Google/Microsoft)? SSO corporativo (SAML/OIDC)?
9. MFA obrigatório para quais papéis?
10. Usuários finais (clientes) também acessam? Por web, app ou ambos?

### C. Dados e compliance
11. Quais dados pessoais/sensíveis serão tratados (CPF, saúde, financeiro, localização, menores)?
12. Requisitos regulatórios além da LGPD (fiscal/NF-e, PCI, saúde, setor financeiro)?
13. Prazos de retenção conhecidos? Precisa de trilha de auditoria para fins legais?

### D. Escala e operação
14. Volume esperado: usuários simultâneos, registros/mês, arquivos/imagens?
15. Precisa funcionar offline (app)? Tempo real (notificações, painel ao vivo)?
16. Onde vai rodar (VPS, cloud, on-premise do cliente)? Requisitos de disponibilidade?
17. Integrações externas (pagamento, WhatsApp, e-mail, ERPs, APIs governamentais)?
18. SEO e tráfego pago são relevantes?

### E. Produto e equipe
19. Plataformas: web, app Android, iOS, painel administrativo?
20. Idioma do código (`pt-BR` padrão ou `en`) e UI multi-idioma?
21. Identidade visual definida (cores, logo, design system)?
22. Restrições de stack vindas do cliente ou da equipe?
23. Prazo e marcos de entrega?

## Saída e gate
- O `docs/PROJECT_BRIEF.md` está preenchido, com regras numeradas (`RN-001`...), atores, glossário e respostas.
- **Gate:** o responsável responde "brief aprovado". Atualize `state.json`: `phase: 2`, `gates.brief.approved_at`.
