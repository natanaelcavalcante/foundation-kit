import type { ContextoExecucao } from './contexto';
import type { Result } from './result';

/** Um caso de uso = uma intenção do usuário. Dependências entram pelo construtor (portas). */
export interface UseCase<Entrada, Saida> {
  executar(entrada: Entrada, ctx: ContextoExecucao): Promise<Result<Saida>>;
}
