---
name: caso-de-uso
description: Cria ou revisa casos de uso (arquivos *.use-case.ts em modules/*/src/aplicacao) no perfil web-nextjs — orquestram permissão, carga de agregados por tenant, regras entre agregados, persistência transacional e eventos. Usar para cada intenção do usuário da spec (IniciarOs, PausarOs, CadastrarVeiculo).
---

# Caso de uso

## Estrutura fixa do `executar`
1. **Permissão:** `exigirPermissao(ctx, 'os:iniciar')`.
2. **Validação da entrada** com VOs (`Id.criar`, ...).
3. **Carga por tenant:** `repo.buscarPorId(id, ctx.tenantId)`. Se não encontrou → `nao_encontrado` (o mesmo para outro tenant: não revele a existência).
4. **Regras entre agregados** (por exemplo, o mecânico já tem uma OS em execução?).
5. **Método da entidade** (que valida as próprias invariantes).
6. **Persistência** dentro de `transacao.executar(...)`, quando mexer em mais de um agregado.
7. Retorna um **DTO** (nunca a entidade).

## Regras
- Implementa `UseCase<Entrada, Saida>` do kernel. Dependências (portas) entram pelo construtor.
- A entrada é um tipo simples (strings, numbers). `tenantId`/`usuarioId` **não** fazem parte da entrada: vêm do `ctx`.
- O tempo vem da porta `Relogio`.
- Regra de exclusividade/concorrência: verifique na aplicação **e** garanta no banco (índice único parcial / lock).
  O repositório traduz a violação de constraint para a falha de negócio (`MECANICO_OCUPADO`).

## Template — `modules/oficina/src/aplicacao/iniciar-os.use-case.ts`
```ts
import { exigirPermissao, falha, Id, Result, type ContextoExecucao, type GerenciadorTransacao, type Relogio, type UseCase } from '@app/kernel';
import type { OrdemServicoRepository } from './ordem-servico.repository';
import { paraOsDTO, type OsDTO } from './os.dto';

export interface IniciarOsEntrada { osId: string; mecanicoId: string }

export class IniciarOs implements UseCase<IniciarOsEntrada, OsDTO> {
  constructor(
    private readonly repo: OrdemServicoRepository,
    private readonly transacao: GerenciadorTransacao,
    private readonly relogio: Relogio,
  ) {}

  async executar(e: IniciarOsEntrada, ctx: ContextoExecucao): Promise<Result<OsDTO>> {
    const perm = exigirPermissao(ctx, 'os:iniciar');
    if (perm.falhou) return Result.fail(perm.falhas);

    const ids = Result.combine([Id.criar(e.osId, 'osId'), Id.criar(e.mecanicoId, 'mecanicoId')]);
    if (ids.falhou) return Result.fail(ids.falhas);
    const [osId, mecanicoId] = ids.valor;

    // RN-001: o próprio mecânico inicia a OS, exceto quem tem permissão de supervisor
    if (mecanicoId.valor !== ctx.usuarioId && !ctx.permissoes.has('os:atribuir')) {
      return Result.fail(falha('ACESSO_NEGADO', 'proibido'));
    }

    return this.transacao.executar(async () => {
      const os = await this.repo.buscarPorId(osId, ctx.tenantId);
      if (!os) return Result.fail(falha('OS_NAO_ENCONTRADA', 'nao_encontrado'));

      const ativa = await this.repo.buscarEmExecucaoDoMecanico(mecanicoId, ctx.tenantId);
      if (ativa && !ativa.equals(os)) {
        return Result.fail(falha('MECANICO_OCUPADO', 'conflito', { detalhes: { osAtivaId: ativa.id.valor } }));
      }

      const r = os.iniciar(mecanicoId, this.relogio.agora());
      if (r.falhou) return Result.fail(r.falhas);

      const salvo = await this.repo.salvar(os); // traduz a violação do índice único → MECANICO_OCUPADO
      return salvo.map(() => paraOsDTO(os));
    });
  }
}
```

## Testes obrigatórios — `test/aplicacao/iniciar-os.use-case.test.ts`
Use **fakes em memória** (`test/fakes/ordem-servico.repo.fake.ts`) que implementam a porta, e um `RelogioFixo`. Não use mock de método.
- O caminho feliz verifica o **estado persistido** no fake e o DTO retornado.
- Sem permissão → `ACESSO_NEGADO`, e nada persistido.
- IDs inválidos → códigos de validação.
- OS de **outro tenant** → `OS_NAO_ENCONTRADA`.
- Cada regra da spec + o cenário de **burla** correspondente (por exemplo, um mecânico iniciando uma OS em nome de outro).
- A falha do repositório é propagada.
- Os nomes dos testes são iguais aos `Scenario` da spec.
