import { falha } from './falha';
import { Result } from './result';

/** Quem está executando. Montado SEMPRE a partir da sessão no servidor — nunca de dados do cliente. */
export interface ContextoExecucao {
  readonly usuarioId: string;
  readonly tenantId: string;
  readonly permissoes: ReadonlySet<string>;
  readonly traceId: string;
}

export const exigirPermissao = (ctx: ContextoExecucao, permissao: string): Result<void> =>
  ctx.permissoes.has(permissao) ? Result.ok() : Result.fail(falha('ACESSO_NEGADO', 'proibido', { detalhes: { permissao } }));
