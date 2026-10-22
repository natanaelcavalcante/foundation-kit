import { createHash, randomBytes } from 'node:crypto';
import type { Id } from '@app/kernel';
import type { Redis } from 'ioredis';
import type { SessaoStore } from '../../aplicacao/portas';

export interface DadosSessao { usuarioId: string; ip: string; userAgent: string; criadaEm: string }

/**
 * Sessão no servidor. O cliente recebe um token opaco (cookie HttpOnly; Secure; SameSite=Lax);
 * no Redis fica só o SHA-256 do token. Revogar = apagar.
 */
export class SessaoRedis implements SessaoStore {
  constructor(private readonly redis: Redis, private readonly duracaoMs = 8 * 3_600_000) {}

  private static chave(token: string) {
    return `sessao:${createHash('sha256').update(token).digest('base64url')}`;
  }

  async criar(usuarioId: Id, origem: { ip: string; userAgent: string }): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const chave = SessaoRedis.chave(token);
    const dados: DadosSessao = { usuarioId: usuarioId.valor, ...origem, criadaEm: new Date().toISOString() };
    await this.redis.multi().set(chave, JSON.stringify(dados), 'PX', this.duracaoMs).sadd(`sessoes:${usuarioId.valor}`, chave).exec();
    return token;
  }

  /** Usado pelo middleware/helper `contextoDaSessao` em cada requisição. Renova a expiração (sessão deslizante). */
  async ler(token: string): Promise<DadosSessao | null> {
    const chave = SessaoRedis.chave(token);
    const json = await this.redis.get(chave);
    if (!json) return null;
    await this.redis.pexpire(chave, this.duracaoMs);
    return JSON.parse(json) as DadosSessao;
  }

  async encerrar(token: string): Promise<void> {
    await this.redis.del(SessaoRedis.chave(token));
  }

  async revogarTodas(usuarioId: Id): Promise<void> {
    const indice = `sessoes:${usuarioId.valor}`;
    const chaves = await this.redis.smembers(indice);
    await this.redis.del(...chaves, indice);
  }
}
