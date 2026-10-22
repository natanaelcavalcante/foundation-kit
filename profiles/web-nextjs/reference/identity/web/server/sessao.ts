// apps/web/src/modules/identity/server/sessao.ts
import 'server-only';
import { cookies, headers } from 'next/headers';
import type { ContextoExecucao } from '@app/kernel';
import type { ContextoPublico } from '@app/identity';
import { permissoesDoUsuario } from '@/modules/access-governance/server/permissoes';
import { sessoes } from './container';

export const COOKIE_SESSAO = '__Host-sessao'; // __Host-: exige Secure, Path=/ e sem Domain

export async function gravarCookieSessao(token: string) {
  (await cookies()).set(COOKIE_SESSAO, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 8 * 3600 });
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) await sessoes.encerrar(token);
  jar.delete(COOKIE_SESSAO);
}

/** IP real: Caddy define X-Real-IP a partir do CF-Connecting-IP (proxies confiáveis). Nunca confie em X-Forwarded-For cru. */
export async function contextoPublico(): Promise<ContextoPublico> {
  const h = await headers();
  return { ip: h.get('x-real-ip') ?? '0.0.0.0', userAgent: h.get('user-agent') ?? '', traceId: h.get('x-trace-id') ?? crypto.randomUUID() };
}

/** Usado por TODA rota/ação privada (helper `rota()` da skill rota-api). Retorna null → 401. */
export async function contextoDaSessao(): Promise<ContextoExecucao | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const sessao = await sessoes.ler(token);
  if (!sessao) return null;
  const { tenantId, permissoes } = await permissoesDoUsuario(sessao.usuarioId);
  return { usuarioId: sessao.usuarioId, tenantId, permissoes, traceId: (await contextoPublico()).traceId };
}
