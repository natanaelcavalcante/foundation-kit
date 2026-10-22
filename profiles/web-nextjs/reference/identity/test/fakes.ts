import { createHmac } from 'node:crypto';
import { Id, type Cifrador, type Relogio } from '@app/kernel';
import type {
  Auditoria, DependenciasIdentity, DesafioMfaStore, EnviadorEmail, EstadoLimite, GeradorAleatorio, HasherSenha,
  LimitadorTentativas, ModeloEmail, ServicoTotp, SessaoStore, TokenRedefinicaoStore, UsuarioRepository, VerificadorSenhaVazada,
} from '../src/aplicacao/portas';
import { DesafioMfa } from '../src/dominio/desafio-mfa.entity';
import { Email } from '../src/dominio/email.vo';
import { duracaoBloqueio, type ConfigBloqueio } from '../src/dominio/politica-bloqueio.service';
import { Usuario, type MfaUsuario, type StatusUsuario } from '../src/dominio/usuario.entity';

export class RelogioFixo implements Relogio {
  constructor(public atual = new Date('2026-03-01T12:00:00Z')) {}
  agora() { return new Date(this.atual); }
  avancar(ms: number) { this.atual = new Date(this.atual.getTime() + ms); }
}

export class UsuariosFake implements UsuarioRepository {
  readonly dados = new Map<string, Usuario>();
  async buscarPorEmail(email: Email) { return [...this.dados.values()].find((u) => u.email.equals(email)) ?? null; }
  async buscarPorId(id: Id) { return this.dados.get(id.valor) ?? null; }
  async salvar(u: Usuario) { this.dados.set(u.id.valor, u); }
}

/** Serializa/restaura como o Redis faria — pega bugs de estado que só existiriam em memória. */
export class DesafiosFake implements DesafioMfaStore {
  readonly dados = new Map<string, Parameters<typeof DesafioMfa.restaurar>[0]>();
  async salvar(d: DesafioMfa) {
    this.dados.set(d.id.valor, {
      id: d.id, usuarioId: d.usuarioId, tipo: d.tipo, metodo: d.metodo, expiraEm: d.expiraEm, tentativasFalhas: d.tentativasFalhas,
      codigoEmailHash: d.codigoEmailHash, codigoEmailExpiraEm: d.codigoEmailExpiraEm, codigoEmailEnviadoEm: d.codigoEmailEnviadoEm,
    });
  }
  async buscar(id: Id) { const p = this.dados.get(id.valor); return p ? DesafioMfa.restaurar({ ...p }) : null; }
  async remover(id: Id) { this.dados.delete(id.valor); }
}

/** Hash "fake" determinístico — os testes de aplicação não precisam do custo do Argon2. */
export class HasherFake implements HasherSenha {
  readonly hashFicticio = 'hash:__ficticio__';
  verificacoes = 0;
  async hash(s: string) { return `hash:${s}`; }
  async verificar(h: string, s: string) { this.verificacoes++; return h === `hash:${s}`; }
}

export class SenhasVazadasFake implements VerificadorSenhaVazada {
  readonly vazadas = new Set<string>(['senha123456']);
  async vazada(s: string) { return this.vazadas.has(s); }
}

/** Códigos válidos: `${passo % 1_000_000}` com 6 dígitos para o segredo `SEGREDO`. */
export class TotpFake implements ServicoTotp {
  gerarSegredo() { return 'SEGREDO'; }
  uri(segredo: string, conta: string) { return `otpauth://totp/App:${conta}?secret=${segredo}`; }
  static codigoPara(agora: Date, delta = 0) { return String((Math.floor(agora.getTime() / 30_000) + delta) % 1_000_000).padStart(6, '0'); }
  verificar(segredo: string, codigo: string, agora: Date) {
    if (segredo !== 'SEGREDO') return null;
    const passo = Math.floor(agora.getTime() / 30_000);
    for (const d of [-1, 0, 1]) if (TotpFake.codigoPara(agora, d) === codigo) return passo + d;
    return null;
  }
}

export class LimitadorFake implements LimitadorTentativas {
  readonly falhas = new Map<string, number>();
  readonly bloqueios = new Map<string, Date>();
  readonly reincidencias = new Map<string, number>();
  async estado(chave: string, agora: Date): Promise<EstadoLimite> {
    const ate = this.bloqueios.get(chave);
    return { bloqueadoAte: ate && ate > agora ? ate : null };
  }
  async registrarFalha(chave: string, config: ConfigBloqueio, agora: Date) {
    const n = (this.falhas.get(chave) ?? 0) + 1;
    this.falhas.set(chave, n);
    if (n < config.maxFalhas) return false;
    const r = this.reincidencias.get(chave) ?? 0;
    this.bloqueios.set(chave, new Date(agora.getTime() + duracaoBloqueio(config, r)));
    this.reincidencias.set(chave, r + 1);
    this.falhas.delete(chave);
    return true;
  }
  async limpar(chave: string) { this.falhas.delete(chave); }
}

export class SessoesFake implements SessaoStore {
  readonly ativas = new Map<string, string>(); // token → usuarioId
  private seq = 0;
  async criar(usuarioId: Id) { const t = `sessao-${++this.seq}`; this.ativas.set(t, usuarioId.valor); return t; }
  async revogarTodas(usuarioId: Id) { for (const [t, u] of this.ativas) if (u === usuarioId.valor) this.ativas.delete(t); }
}

export class TokensFake implements TokenRedefinicaoStore {
  readonly dados = new Map<string, { usuarioId: Id; expiraEm: Date }>();
  async salvar(h: string, usuarioId: Id, expiraEm: Date) { this.dados.set(h, { usuarioId, expiraEm }); }
  async consumir(h: string, agora: Date) {
    const t = this.dados.get(h);
    this.dados.delete(h);
    return t && agora < t.expiraEm ? t.usuarioId : null;
  }
}

export class EmailFake implements EnviadorEmail {
  readonly enviados: { para: string; modelo: ModeloEmail; dados: Record<string, string | number> }[] = [];
  async enviar(m: (typeof this.enviados)[number]) { this.enviados.push(m); }
  ultimo(modelo: ModeloEmail) { return [...this.enviados].reverse().find((e) => e.modelo === modelo); }
}

export class AleatorioFake implements GeradorAleatorio {
  private seq = 0;
  token() { return `token-${++this.seq}`; }
  codigoNumerico(digitos: number) { return String(++this.seq).padStart(digitos, '0'); }
  codigoRecuperacao() { const n = String(++this.seq).padStart(8, '0'); return `R${n.slice(1, 4)}-${n.slice(4)}`; }
}

export class CifradorFake implements Cifrador {
  async cifrar(t: string) { return `cifrado:${Buffer.from(t).toString('base64')}`; }
  async decifrar(c: string) { return Buffer.from(c.replace('cifrado:', ''), 'base64').toString(); }
  indiceCego(v: string) { return createHmac('sha256', 'k').update(v).digest('hex'); }
}

export class AuditoriaFake implements Auditoria {
  readonly eventos: { evento: string; dados: Record<string, unknown> }[] = [];
  async registrar(evento: string, dados: Record<string, unknown>) { this.eventos.push({ evento, dados }); }
  nomes() { return this.eventos.map((e) => e.evento); }
}

export function montar(config: Partial<DependenciasIdentity['config']> = {}) {
  const d = {
    usuarios: new UsuariosFake(), desafios: new DesafiosFake(), hasher: new HasherFake(), senhasVazadas: new SenhasVazadasFake(),
    totp: new TotpFake(), limitador: new LimitadorFake(), sessoes: new SessoesFake(), tokensRedefinicao: new TokensFake(),
    email: new EmailFake(), aleatorio: new AleatorioFake(), cifrador: new CifradorFake(), auditoria: new AuditoriaFake(),
    relogio: new RelogioFixo(), config: { mfaObrigatorio: true, urlApp: 'https://app.test', nomeApp: 'App', ...config },
  };
  return d satisfies DependenciasIdentity;
}

export type Deps = ReturnType<typeof montar>;

export const SENHA = 'senha-correta-123';
export const CTX = { ip: '203.0.113.7', userAgent: 'vitest', traceId: 't-1' };

export async function criarUsuario(
  d: Deps,
  o: { email?: string; status?: StatusUsuario; mfa?: Partial<MfaUsuario>; codigosRecuperacao?: string[] } = {},
): Promise<Usuario> {
  const u = Usuario.restaurar({
    id: Id.novo(),
    email: Email.criar(o.email ?? 'ana@oficina.com').valor,
    nome: 'Ana',
    senhaHash: `hash:${SENHA}`,
    status: o.status ?? 'ATIVO',
    mfa: { segredoCifrado: null, confirmado: false, metodoPreferido: 'TOTP', ultimoPassoTotp: null, ...o.mfa },
    codigosRecuperacao: o.codigosRecuperacao ?? [],
  });
  await d.usuarios.salvar(u);
  return u;
}

/** Usuário com MFA já configurado (segredo `SEGREDO` cifrado). */
export async function criarUsuarioComMfa(d: Deps, o: Parameters<typeof criarUsuario>[1] = {}) {
  return criarUsuario(d, { ...o, mfa: { segredoCifrado: await d.cifrador.cifrar('SEGREDO'), confirmado: true, ...o.mfa } });
}
