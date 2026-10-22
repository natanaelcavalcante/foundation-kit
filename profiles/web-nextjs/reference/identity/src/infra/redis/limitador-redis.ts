import type { Redis } from 'ioredis';
import type { EstadoLimite, LimitadorTentativas } from '../../aplicacao/portas';
import { duracaoBloqueio, type ConfigBloqueio } from '../../dominio/politica-bloqueio.service';

/**
 * Chaves: `rl:{chave}:falhas` (contador na janela), `rl:{chave}:bloqueio` (até quando),
 * `rl:{chave}:reincidencia` (quantos bloqueios nas últimas 24h → bloqueio progressivo).
 */
export class LimitadorRedis implements LimitadorTentativas {
  constructor(private readonly redis: Redis) {}

  async estado(chave: string, agora: Date): Promise<EstadoLimite> {
    const ate = await this.redis.get(`rl:${chave}:bloqueio`);
    const bloqueadoAte = ate && Number(ate) > agora.getTime() ? new Date(Number(ate)) : null;
    return { bloqueadoAte };
  }

  async registrarFalha(chave: string, config: ConfigBloqueio, agora: Date): Promise<boolean> {
    const kFalhas = `rl:${chave}:falhas`;
    const falhas = await this.redis.incr(kFalhas);
    if (falhas === 1) await this.redis.pexpire(kFalhas, config.janelaMs);
    if (falhas < config.maxFalhas) return false;

    const kReinc = `rl:${chave}:reincidencia`;
    const anteriores = Number((await this.redis.get(kReinc)) ?? 0);
    const duracao = duracaoBloqueio(config, anteriores);
    await this.redis
      .multi()
      .set(`rl:${chave}:bloqueio`, String(agora.getTime() + duracao), 'PX', duracao)
      .set(kReinc, String(anteriores + 1), 'PX', 24 * 3_600_000)
      .del(kFalhas)
      .exec();
    return true;
  }

  async limpar(chave: string): Promise<void> {
    await this.redis.del(`rl:${chave}:falhas`);
  }
}
