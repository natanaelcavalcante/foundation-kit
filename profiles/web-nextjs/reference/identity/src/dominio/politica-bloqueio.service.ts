/**
 * Bloqueio progressivo contra força bruta (inspirado no ExponentialRateLimiter do NexusCMS):
 * a cada bloqueio reincidente a duração dobra, até um teto.
 */
export interface ConfigBloqueio {
  maxFalhas: number;
  janelaMs: number;
  bloqueioBaseMs: number;
  bloqueioMaximoMs: number;
}

export const BLOQUEIO_LOGIN_CONTA: ConfigBloqueio = { maxFalhas: 5, janelaMs: 15 * 60_000, bloqueioBaseMs: 15 * 60_000, bloqueioMaximoMs: 24 * 3_600_000 };
export const BLOQUEIO_LOGIN_IP: ConfigBloqueio = { maxFalhas: 20, janelaMs: 60_000, bloqueioBaseMs: 5 * 60_000, bloqueioMaximoMs: 24 * 3_600_000 };
export const BLOQUEIO_REDEFINICAO: ConfigBloqueio = { maxFalhas: 3, janelaMs: 3_600_000, bloqueioBaseMs: 3_600_000, bloqueioMaximoMs: 24 * 3_600_000 };

export function duracaoBloqueio(config: ConfigBloqueio, bloqueiosAnteriores: number): number {
  const fator = 2 ** Math.max(0, Math.min(bloqueiosAnteriores, 20));
  return Math.min(config.bloqueioBaseMs * fator, config.bloqueioMaximoMs);
}
