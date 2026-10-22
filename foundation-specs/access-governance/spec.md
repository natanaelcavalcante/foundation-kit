# access-governance — Autorização, papéis e tenants

## ADDED Requirements

### Requirement: Negação por padrão
Toda rota/ação MUST exigir autenticação, salvo as declaradas explicitamente como públicas.

#### Scenario: Rota nova sem declaração
- **WHEN** uma rota é criada sem marcação de pública
- **THEN** requisições sem sessão recebem 401 (há um teste automatizado que varre todas as rotas registradas)

---

### Requirement: RBAC por permissões granulares
O sistema SHALL modelar `Permissao` (`recurso:acao`), `Papel` (conjunto de permissões) e a atribuição de papéis a usuários (por tenant).
O código MUST verificar permissões, nunca nomes de papéis.

#### Scenario: Permissão insuficiente
- **WHEN** o usuário não tem a permissão exigida pela ação
- **THEN** recebe 403 `ACESSO_NEGADO`, e a tentativa é auditada

#### Scenario: Alteração de papéis exige permissão própria
- **WHEN** um usuário tenta atribuir a si mesmo ou a outro um papel com permissões que ele não possui
- **THEN** a operação é negada (impede escalada de privilégio)

---

### Requirement: Isolamento por tenant e propriedade
Quando `{{multi_tenant}}` for verdadeiro, todo dado de negócio MUST pertencer a um tenant, e toda leitura/escrita MUST filtrar pelo tenant da sessão.
O identificador de usuário/tenant MUST vir da sessão, nunca da requisição.

#### Scenario: Acesso a recurso de outro tenant (IDOR)
- **WHEN** um usuário requisita, por ID, um recurso de outro tenant/usuário
- **THEN** recebe 404 (sem revelar a existência), e a tentativa é auditada

#### Scenario: Tentativa de injetar tenantId no body
- **WHEN** a requisição envia `tenantId`/`userId` diferente do da sessão
- **THEN** o valor é ignorado ou rejeitado, e a operação ocorre no tenant da sessão

#### Scenario: Segunda barreira no banco
- **WHEN** o perfil suporta Row Level Security
- **THEN** as políticas RLS impedem a leitura entre tenants mesmo que a aplicação esqueça o filtro (teste de integração dedicado)
