<!-- openspec/changes/<modulo>/specs/<modulo>/spec.md -->
# <modulo>

## Contexto
Objetivo do módulo, atores, regras do brief cobertas (RN-xxx).

## Dados pessoais
| Campo | Sensível (cifrar)? | Finalidade | Retenção | Exportável/Anonimizável |
|---|---|---|---|---|

## Permissões
| Permissão | Papéis padrão |
|---|---|

## ADDED Requirements

### Requirement: <RN-001> Mecânico com uma única OS em execução
O sistema MUST impedir que um mecânico tenha mais de uma OS em `EM_EXECUCAO`. Para iniciar/retomar outra, a atual MUST ser pausada com justificativa (mín. 10 caracteres).

#### Scenario: Iniciar OS estando livre
- **WHEN** um mecânico sem OS em execução inicia a OS #10
- **THEN** a OS #10 fica `EM_EXECUCAO` atribuída a ele, e o apontamento de tempo começa

#### Scenario: Burla — iniciar segunda OS via API
- **WHEN** um mecânico com a OS #10 em execução chama diretamente a rota para iniciar a OS #11
- **THEN** recebe `MECANICO_OCUPADO`, e nada é alterado

#### Scenario: Burla — requisições simultâneas
- **WHEN** duas requisições para iniciar OSs diferentes chegam ao mesmo tempo
- **THEN** exatamente uma tem sucesso (garantia por constraint/lock no banco)

#### Scenario: Pausar sem justificativa
- **WHEN** o mecânico tenta pausar sem justificativa ou com menos de 10 caracteres
- **THEN** recebe `JUSTIFICATIVA_OBRIGATORIA`

#### Scenario: Autorização — OS de outra oficina
- **WHEN** o mecânico tenta iniciar uma OS de outro tenant
- **THEN** recebe 404

## Fora de escopo
