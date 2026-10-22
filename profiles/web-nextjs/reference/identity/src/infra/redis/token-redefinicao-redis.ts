import { Id } from '@app/kernel';
import type { Redis } from 'ioredis';
import type { TokenRedefinicaoStore } from '../../aplicacao/portas';

export class TokenRedefinicaoRedis implements TokenRedefinicaoStore {
  constructor(private readonly redis: Redis) {}

  async salvar(hashToken: string, usuarioId: Id, expiraEm: Date): Promise<void> {
    await this.redis.set(`redefinicao:${hashToken}`, JSON.stringify({ usuarioId: usuarioId.valor, expiraEm: expiraEm.getTime() }), 'PXAT', expiraEm.getTime());
  }

  async consumir(hashToken: string, agora: Date): Promise<Id | null> {
    const json = await this.redis.getdel(`redefinicao:${hashToken}`); // atômico: uso único mesmo com requisições simultâneas
    if (!json) return null;
    const { usuarioId, expiraEm } = JSON.parse(json) as { usuarioId: string; expiraEm: number };
    if (agora.getTime() >= expiraEm) return null;
    const id = Id.criar(usuarioId);
    return id.ok ? id.valor : null;
  }
}
