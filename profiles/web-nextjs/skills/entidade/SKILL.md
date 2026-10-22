---
name: entidade
description: Cria ou revisa entidades e agregados de domínio (arquivos *.entity.ts) no perfil web-nextjs — identidade, invariantes, máquina de estados, métodos de domínio que retornam Result e eventos. Usar quando a spec definir um conceito com identidade e ciclo de vida (OrdemServico, Veiculo, Cliente).
---

# Entidade / Agregado

## Regras
- Estenda `Entity<Props>` de `@app/kernel`. Construtor **privado**.
- `static criar(entrada, agora: Date): Result<E>` para entidades **novas**: valida tudo com VOs + `Result.combine` e aplica as regras de criação.
- `static restaurar(props & { id }): E` para reidratar do banco: **sem** revalidar regras de criação (que podem ter mudado), só montar.
- **Sem setters.** Toda mudança é um método com nome do negócio (`iniciar`, `pausar`, `concluir`) que:
  1. valida pré-condições (estado atual, argumentos) → `Result.fail` sem alterar nada;
  2. altera `this.props`;
  3. registra o evento (`this.registrar('OsPausada', {...}, agora)`).
- Transições de estado ficam explícitas numa tabela; transições inválidas falham com `TRANSICAO_INVALIDA`.
- O agregado protege as invariantes **dele**. Regras que envolvem vários agregados (por exemplo, "mecânico com uma só OS ativa")
  vão para o caso de uso/serviço de domínio + uma garantia no banco (ver `repositorio`).
- Getters só para o que é necessário; nunca exponha `props` mutável.

## Template — `modules/oficina/src/dominio/ordem-servico.entity.ts`
```ts
import { Entity, falha, Id, Result } from '@app/kernel';
import { Justificativa } from './justificativa.vo';

export type StatusOs = 'ABERTA' | 'EM_EXECUCAO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA';

const TRANSICOES: Record<StatusOs, readonly StatusOs[]> = {
  ABERTA: ['EM_EXECUCAO', 'CANCELADA'],
  EM_EXECUCAO: ['PAUSADA', 'CONCLUIDA'],
  PAUSADA: ['EM_EXECUCAO', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
};

interface Props {
  tenantId: string;
  veiculoId: Id;
  status: StatusOs;
  mecanicoId: Id | null;
  pausas: { motivo: string; em: Date }[];
  criadaEm: Date;
}

export class OrdemServico extends Entity<Props> {
  private constructor(id: Id, props: Props) {
    super(id, props);
  }

  static criar(e: { tenantId: string; veiculoId: unknown }, agora: Date): Result<OrdemServico> {
    return Id.criar(e.veiculoId, 'veiculoId').map(
      (veiculoId) =>
        new OrdemServico(Id.novo(), { tenantId: e.tenantId, veiculoId, status: 'ABERTA', mecanicoId: null, pausas: [], criadaEm: agora }),
    );
  }

  static restaurar(p: Props & { id: Id }): OrdemServico {
    const { id, ...props } = p;
    return new OrdemServico(id, props);
  }

  get status() { return this.props.status; }
  get mecanicoId() { return this.props.mecanicoId; }
  get tenantId() { return this.props.tenantId; }

  iniciar(mecanicoId: Id, agora: Date): Result<void> {
    return this.transicionar('EM_EXECUCAO').map(() => {
      this.props.mecanicoId = mecanicoId;
      this.registrar('OsIniciada', { osId: this.id.valor, mecanicoId: mecanicoId.valor }, agora);
    });
  }

  pausar(motivo: unknown, agora: Date): Result<void> {
    return Result.combine([this.podeTransicionar('PAUSADA'), Justificativa.criar(motivo)]).map(([, justificativa]) => {
      this.props.status = 'PAUSADA';
      this.props.pausas.push({ motivo: justificativa.valor, em: agora });
      this.registrar('OsPausada', { osId: this.id.valor, motivo: justificativa.valor }, agora);
    });
  }

  private podeTransicionar(para: StatusOs): Result<void> {
    return TRANSICOES[this.props.status].includes(para)
      ? Result.ok()
      : Result.fail(falha('TRANSICAO_INVALIDA', 'regra_negocio', { detalhes: { de: this.props.status, para } }));
  }

  private transicionar(para: StatusOs): Result<void> {
    return this.podeTransicionar(para).map(() => { this.props.status = para; });
  }
}
```

## Testes obrigatórios
- Criação válida e cada entrada inválida (códigos exatos).
- **Matriz de transições**: para cada par (de, para), permitido ou `TRANSICAO_INVALIDA` (use `it.each` sobre a tabela).
- Em uma falha, **o estado não muda** e nenhum evento é registrado.
- Eventos corretos (nome e dados) após cada método.
- `restaurar` reconstrói sem revalidar.
- Use datas fixas (`new Date('2026-01-01T10:00:00Z')`), nunca o relógio real.
