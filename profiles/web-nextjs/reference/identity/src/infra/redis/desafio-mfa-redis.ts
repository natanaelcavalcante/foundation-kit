import { Id } from '@app/kernel';
import type { Redis } from 'ioredis';
import type { DesafioMfaStore } from '../../aplicacao/portas';
import { DesafioMfa } from '../../dominio/desafio-mfa.entity';

const dataOuNull = (v: string | null) => (v ? new Date(v) : null);

export class DesafioMfaRedis implements DesafioMfaStore {
  constructor(private readonly redis: Redis, private readonly relogio: { agora(): Date } = { agora: () => new Date() }) {}

  async salvar(d: DesafioMfa): Promise<void> {
    const ttl = Math.max(1, d.expiraEm.getTime() - this.relogio.agora().getTime());
    const json = JSON.stringify({
      usuarioId: d.usuarioId.valor,
      tipo: d.tipo,
      metodo: d.metodo,
      expiraEm: d.expiraEm.toISOString(),
      tentativasFalhas: d.tentativasFalhas,
      codigoEmailHash: d.codigoEmailHash,
      codigoEmailExpiraEm: d.codigoEmailExpiraEm?.toISOString() ?? null,
      codigoEmailEnviadoEm: d.codigoEmailEnviadoEm?.toISOString() ?? null,
    });
    await this.redis.set(`mfa:desafio:${d.id.valor}`, json, 'PX', ttl);
  }

  async buscar(id: Id): Promise<DesafioMfa | null> {
    const json = await this.redis.get(`mfa:desafio:${id.valor}`);
    if (!json) return null;
    const p = JSON.parse(json);
    return DesafioMfa.restaurar({
      id,
      usuarioId: Id.criar(p.usuarioId).valor,
      tipo: p.tipo,
      metodo: p.metodo,
      expiraEm: new Date(p.expiraEm),
      tentativasFalhas: p.tentativasFalhas,
      codigoEmailHash: p.codigoEmailHash,
      codigoEmailExpiraEm: dataOuNull(p.codigoEmailExpiraEm),
      codigoEmailEnviadoEm: dataOuNull(p.codigoEmailEnviadoEm),
    });
  }

  async remover(id: Id): Promise<void> {
    await this.redis.del(`mfa:desafio:${id.valor}`);
  }
}
