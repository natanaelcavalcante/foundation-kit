// apps/web/src/modules/identity/server/actions.ts
// Server Actions das telas públicas de autenticação. Retornam { ok, ... } | { ok:false, falhas } para o form.
'use server';
import { z } from 'zod';
import { identity } from './container';
import { contextoPublico, encerrarSessao, gravarCookieSessao } from './sessao';

const respostaDe = <T>(r: { ok: boolean; valor: T; falhas: readonly unknown[] }) => (r.ok ? { ok: true as const, ...(r.valor as object) } : { ok: false as const, falhas: r.falhas });

export async function loginAction(entrada: unknown) {
  const e = z.object({ email: z.string().max(254), senha: z.string().max(128) }).strict().parse(entrada);
  const r = await (await identity()).autenticar.executar(e, await contextoPublico());
  if (r.ok && r.valor.etapa === 'SESSAO') await gravarCookieSessao(r.valor.token);
  // Nunca devolva o token ao cliente: só a etapa seguinte.
  return r.ok && r.valor.etapa === 'SESSAO' ? { ok: true as const, etapa: 'SESSAO' as const } : respostaDe(r);
}

export async function confirmarCadastroMfaAction(entrada: unknown) {
  const e = z.object({ desafioId: z.string().uuid(), codigo: z.string().max(10) }).strict().parse(entrada);
  const r = await (await identity()).confirmarCadastroMfa.executar(e, await contextoPublico());
  if (!r.ok) return respostaDe(r);
  await gravarCookieSessao(r.valor.token);
  return { ok: true as const, codigosRecuperacao: r.valor.codigosRecuperacao }; // exibidos UMA vez
}

export async function verificarMfaAction(entrada: unknown) {
  const e = z.object({ desafioId: z.string().uuid(), codigo: z.string().max(12), metodo: z.enum(['TOTP', 'EMAIL', 'RECUPERACAO']) }).strict().parse(entrada);
  const r = await (await identity()).verificarMfa.executar(e, await contextoPublico());
  if (!r.ok) return respostaDe(r);
  await gravarCookieSessao(r.valor.token);
  return { ok: true as const, codigosRecuperacaoRestantes: r.valor.codigosRecuperacaoRestantes };
}

export async function solicitarCodigoEmailAction(entrada: unknown) {
  const e = z.object({ desafioId: z.string().uuid() }).strict().parse(entrada);
  return respostaDe(await (await identity()).solicitarCodigoEmail.executar(e));
}

export async function solicitarRedefinicaoAction(entrada: unknown) {
  const e = z.object({ email: z.string().max(254) }).strict().parse(entrada);
  await (await identity()).solicitarRedefinicaoSenha.executar(e, await contextoPublico());
  return { ok: true as const }; // sempre igual
}

export async function redefinirSenhaAction(entrada: unknown) {
  const e = z.object({ token: z.string().max(100), novaSenha: z.string().max(128) }).strict().parse(entrada);
  return respostaDe(await (await identity()).redefinirSenha.executar(e, await contextoPublico()));
}

export async function logoutAction() {
  await encerrarSessao();
  return { ok: true as const };
}
