# Modo Refatoração — enquadrar um projeto existente

1. **Inventário** (somente leitura): stack, estrutura, módulos implícitos, testes e cobertura atuais, autenticação/segurança, dados pessoais.
2. **Engenharia reversa de specs**: para cada módulo, gere specs OpenSpec descrevendo o comportamento **atual**
   (`openspec/specs/`). Confirme as regras de negócio inferidas com o responsável. Isso equivale à Fase 1.
3. **Gap analysis** → `docs/REFACTOR_PLAN.md`: constituição × realidade, item a item (arquitetura, testes,
   segurança, LGPD), com severidade. Escolha o perfil mais próximo e registre os desvios em ADR. Isso equivale à Fase 2 (gate: "plano aprovado").
4. **Rede de segurança primeiro**: testes de caracterização (comportamento atual) antes de mover código.
5. **Correções de segurança críticas** (hash de senha, IDOR, segredos expostos, rate limit) antes de qualquer refatoração estrutural.
6. **Strangler**: migre módulo a módulo para a estrutura do perfil, sempre com a suíte verde. Cada passo é uma change OpenSpec.
7. Ao final, o projeto segue a Fase 4 normalmente.
