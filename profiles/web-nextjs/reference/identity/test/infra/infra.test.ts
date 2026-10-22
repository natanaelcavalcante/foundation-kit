import { Id } from '@app/kernel';
import RedisMock from 'ioredis-mock';
import { describe, expect, it } from 'vitest';
import { DesafioMfa } from '../../src/dominio/desafio-mfa.entity';
import { BLOQUEIO_LOGIN_CONTA } from '../../src/dominio/politica-bloqueio.service';
import { CifradorAesGcm } from '../../src/infra/cifrador-aes-gcm';
import { EnviadorSmtp } from '../../src/infra/email/enviador-smtp';
import { GeradorAleatorioNode } from '../../src/infra/gerador-aleatorio-node';
import { HasherArgon2 } from '../../src/infra/hasher-argon2';
import { DesafioMfaRedis } from '../../src/infra/redis/desafio-mfa-redis';
import { LimitadorRedis } from '../../src/infra/redis/limitador-redis';
import { SessaoRedis } from '../../src/infra/redis/sessao-redis';
import { TokenRedefinicaoRedis } from '../../src/infra/redis/token-redefinicao-redis';
import { SenhaVazadaHibp } from '../../src/infra/senha-vazada-hibp';
import { base32Decode, base32Encode, hotp, TotpRfc6238 } from '../../src/infra/totp-rfc6238';

describe('TOTP (RFC 6238)', () => {
  // Vetor oficial: segredo ASCII "12345678901234567890", SHA-1
  const segredo = base32Encode(Buffer.from('12345678901234567890'));
  const totp = new TotpRfc6238('Oficina');

  it.each([
    [59, '94287082'], [1111111109, '07081804'], [1234567890, '89005924'], [2000000000, '69279037'],
  ])('vetor RFC em t=%s', (t, esperado) => {
    expect(hotp(base32Decode(segredo), Math.floor(t / 30), 8)).toBe(esperado);
  });

  it('aceita janela ±1 e devolve o passo', () => {
    const agora = new Date(59_000);
    expect(totp.verificar(segredo, '287082', agora)).toBe(1);
    expect(totp.verificar(segredo, hotp(base32Decode(segredo), 0), agora)).toBe(0);
    expect(totp.verificar(segredo, hotp(base32Decode(segredo), 3), agora)).toBeNull();
    expect(totp.verificar(segredo, 'abc', agora)).toBeNull();
  });

  it('gera segredo de 160 bits e URI otpauth', () => {
    const s = totp.gerarSegredo();
    expect(base32Decode(s)).toHaveLength(20);
    expect(totp.uri(s, 'ana@oficina.com')).toMatch(/^otpauth:\/\/totp\/Oficina%3Aana%40oficina\.com\?secret=[A-Z2-7]+&issuer=Oficina/);
    expect(() => base32Decode('1!')).toThrow();
  });
});

describe('CifradorAesGcm', () => {
  const k = (n: number) => Buffer.alloc(32, n);
  const cif = new CifradorAesGcm({ chaves: { 1: k(1) }, versaoEscrita: 1, chaveIndice: k(9) });

  it('round-trip, IV aleatório e formato versionado', async () => {
    const a = await cif.cifrar('123.456.789-00');
    const b = await cif.cifrar('123.456.789-00');
    expect(a).toMatch(/^v1:/);
    expect(a).not.toBe(b);
    expect(a).not.toContain('123');
    expect(await cif.decifrar(a)).toBe('123.456.789-00');
    expect(cif.versaoDe(a)).toBe(1);
  });

  it('Adulteração detectada', async () => {
    const c = await cif.cifrar('segredo');
    const [v, iv, ct] = c.split(':');
    const adulterado = Buffer.from(ct!, 'base64url');
    adulterado[0]! ^= 1;
    await expect(cif.decifrar(`${v}:${iv}:${adulterado.toString('base64url')}`)).rejects.toThrow();
    await expect(cif.decifrar('lixo')).rejects.toThrow('Formato');
    await expect(cif.decifrar('v7:aa:bb')).rejects.toThrow('indisponível');
  });

  it('Nova chave: dados antigos continuam legíveis', async () => {
    const antigo = await cif.cifrar('x');
    const novo = new CifradorAesGcm({ chaves: { 1: k(1), 2: k(2) }, versaoEscrita: 2, chaveIndice: k(9) });
    expect(await novo.decifrar(antigo)).toBe('x');
    expect(novo.versaoDe(await novo.cifrar('x'))).toBe(2);
  });

  it('índice cego é determinístico e depende da chave', () => {
    const outro = new CifradorAesGcm({ chaves: { 1: k(1) }, versaoEscrita: 1, chaveIndice: k(8) });
    expect(cif.indiceCego('a')).toBe(cif.indiceCego('a'));
    expect(cif.indiceCego('a')).not.toBe(outro.indiceCego('a'));
  });

  it('valida chaves e lê do ambiente', async () => {
    expect(() => new CifradorAesGcm({ chaves: { 1: Buffer.alloc(16) }, versaoEscrita: 1, chaveIndice: k(1) })).toThrow();
    expect(() => new CifradorAesGcm({ chaves: { 1: k(1) }, versaoEscrita: 2, chaveIndice: k(1) })).toThrow();
    expect(() => new CifradorAesGcm({ chaves: { 1: k(1) }, versaoEscrita: 1, chaveIndice: Buffer.alloc(3) })).toThrow();
    const env = { CHAVE_MESTRA: k(3).toString('base64'), CHAVE_MESTRA_ANTERIOR: k(1).toString('base64'), CHAVE_VERSAO: '2', CHAVE_INDICE: k(9).toString('base64') };
    const doEnv = CifradorAesGcm.doAmbiente(env);
    expect(await doEnv.decifrar(await cif.cifrar('y'))).toBe('y');
    expect(() => CifradorAesGcm.doAmbiente({})).toThrow('CHAVE_MESTRA');
  });
});

describe('HasherArgon2', () => {
  it('gera argon2id, verifica e não lança com hash inválido', async () => {
    const h = await HasherArgon2.criar();
    const hash = await h.hash('senha-forte-123');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await h.verificar(hash, 'senha-forte-123')).toBe(true);
    expect(await h.verificar(hash, 'errada')).toBe(false);
    expect(await h.verificar('nao-e-hash', 'x')).toBe(false);
    expect(await h.verificar(h.hashFicticio, 'qualquer')).toBe(false);
  });
});

describe('GeradorAleatorioNode', () => {
  const g = new GeradorAleatorioNode();
  it('formatos', () => {
    expect(g.token()).toMatch(/^[\w-]{43}$/);
    expect(g.codigoNumerico(6)).toMatch(/^\d{6}$/);
    expect(g.codigoRecuperacao()).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(new Set(Array.from({ length: 50 }, () => g.token())).size).toBe(50);
  });
});

describe('SenhaVazadaHibp', () => {
  // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
  const resposta = (corpo: string, ok = true) => (async () => ({ ok, text: async () => corpo })) as unknown as typeof fetch;
  it('envia só o prefixo e encontra o sufixo', async () => {
    let url = '';
    const f = (async (u: string) => { url = u; return { ok: true, text: async () => '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3\r\nAAA:0' }; }) as unknown as typeof fetch;
    expect(await new SenhaVazadaHibp(f).vazada('password')).toBe(true);
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
  });
  it('padding (contagem 0) não conta; falha do serviço não bloqueia', async () => {
    expect(await new SenhaVazadaHibp(resposta('1E4C9B93F3F0682250B6CF8331B7EE68FD8:0')).vazada('password')).toBe(false);
    expect(await new SenhaVazadaHibp(resposta('', false)).vazada('password')).toBe(false);
    expect(await new SenhaVazadaHibp((async () => { throw new Error('rede'); }) as unknown as typeof fetch).vazada('password')).toBe(false);
  });
});

describe('Redis', () => {
  const T0 = new Date('2026-03-01T12:00:00Z');

  it('LimitadorRedis bloqueia na N-ésima falha, progressivamente', async () => {
    const r = new RedisMock();
    const l = new LimitadorRedis(r as never);
    for (let i = 0; i < 4; i++) expect(await l.registrarFalha('c', BLOQUEIO_LOGIN_CONTA, T0)).toBe(false);
    expect(await l.registrarFalha('c', BLOQUEIO_LOGIN_CONTA, T0)).toBe(true);
    expect((await l.estado('c', T0)).bloqueadoAte?.getTime()).toBe(T0.getTime() + 15 * 60_000);
    expect((await l.estado('c', new Date(T0.getTime() + 15 * 60_000))).bloqueadoAte).toBeNull();
    for (let i = 0; i < 5; i++) await l.registrarFalha('c', BLOQUEIO_LOGIN_CONTA, T0);
    expect((await l.estado('c', T0)).bloqueadoAte?.getTime()).toBe(T0.getTime() + 30 * 60_000);
    await l.registrarFalha('d', BLOQUEIO_LOGIN_CONTA, T0);
    await l.limpar('d');
    expect(await r.get('rl:d:falhas')).toBeNull();
  });

  it('DesafioMfaRedis preserva todos os campos', async () => {
    const store = new DesafioMfaRedis(new RedisMock() as never, { agora: () => T0 });
    const d = DesafioMfa.criar({ usuarioId: Id.novo(), tipo: 'VERIFICACAO', metodo: 'TOTP' }, T0);
    d.emitirCodigoEmail('hash', T0);
    d.registrarFalha();
    await store.salvar(d);
    const lido = await store.buscar(d.id);
    expect(lido).toMatchObject({ tipo: 'VERIFICACAO', metodo: 'EMAIL', tentativasFalhas: 1, codigoEmailHash: 'hash' });
    expect(lido?.usuarioId.equals(d.usuarioId)).toBe(true);
    expect(lido?.codigoEmailExpiraEm?.getTime()).toBe(d.codigoEmailExpiraEm?.getTime());
    await store.remover(d.id);
    expect(await store.buscar(d.id)).toBeNull();
  });

  it('SessaoRedis: token opaco, hash no Redis, revogação total', async () => {
    const r = new RedisMock();
    const s = new SessaoRedis(r as never);
    const u = Id.novo();
    const t1 = await s.criar(u, { ip: '1.1.1.1', userAgent: 'x' });
    const t2 = await s.criar(u, { ip: '1.1.1.1', userAgent: 'x' });
    expect(await r.keys(`*${t1}*`)).toEqual([]);
    expect((await s.ler(t1))?.usuarioId).toBe(u.valor);
    await s.encerrar(t1);
    expect(await s.ler(t1)).toBeNull();
    await s.revogarTodas(u);
    expect(await s.ler(t2)).toBeNull();
  });

  it('TokenRedefinicaoRedis: uso único e expiração', async () => {
    const t = new TokenRedefinicaoRedis(new RedisMock() as never);
    const u = Id.novo();
    const futuro = new Date(Date.now() + 60_000);
    await t.salvar('h', u, futuro);
    expect((await t.consumir('h', new Date()))?.equals(u)).toBe(true);
    expect(await t.consumir('h', new Date())).toBeNull();
    await t.salvar('h2', u, futuro);
    expect(await t.consumir('h2', new Date(futuro.getTime() + 1))).toBeNull();
  });
});

describe('EnviadorSmtp (servidor próprio, mesmas variáveis MAIL_* do NexusCMS)', () => {
  const marca = { nomeApp: 'Oficina', corPrimaria: '#6349F6', rodape: '© Nexus Solutions' };

  it('lê a configuração do ambiente como o Laravel', () => {
    expect(EnviadorSmtp.configDoAmbiente({ MAIL_HOST: 'mail.exemplo.com', MAIL_PORT: '587', MAIL_USERNAME: 'u', MAIL_PASSWORD: 'p', MAIL_ENCRYPTION: 'tls', MAIL_FROM_ADDRESS: 'no-reply@exemplo.com', MAIL_FROM_NAME: 'Exemplo' }))
      .toEqual({ host: 'mail.exemplo.com', porta: 587, criptografia: 'tls', usuario: 'u', senha: 'p', remetente: { email: 'no-reply@exemplo.com', nome: 'Exemplo' } });
    expect(EnviadorSmtp.configDoAmbiente({ MAIL_HOST: 'h', MAIL_FROM_ADDRESS: 'a@b.c', MAIL_ENCRYPTION: 'ssl' })).toMatchObject({ porta: 465, criptografia: 'ssl' });
    expect(EnviadorSmtp.configDoAmbiente({ MAIL_HOST: 'h', MAIL_FROM_ADDRESS: 'a@b.c', MAIL_ENCRYPTION: 'null', MAIL_PORT: '1025' })).toMatchObject({ porta: 1025, criptografia: 'nenhuma' });
    expect(() => EnviadorSmtp.configDoAmbiente({})).toThrow();
  });

  it('cria transporte real sem conectar', () => {
    expect(EnviadorSmtp.criar(EnviadorSmtp.configDoAmbiente({ MAIL_HOST: 'h', MAIL_FROM_ADDRESS: 'a@b.c', MAIL_USERNAME: 'u' }), marca)).toBeInstanceOf(EnviadorSmtp);
  });

  it.each(['CODIGO_MFA', 'REDEFINIR_SENHA', 'SENHA_ALTERADA', 'CONTA_BLOQUEADA', 'MFA_ATIVADO', 'CODIGO_RECUPERACAO_USADO'] as const)(
    'renderiza %s em pt-BR com HTML e texto',
    async (modelo) => {
      const enviados: Record<string, unknown>[] = [];
      const e = new EnviadorSmtp({ sendMail: async (m: Record<string, unknown>) => { enviados.push(m); return {} as never; } } as never, { email: 'no-reply@x.com', nome: 'X' }, marca);
      await e.enviar({ para: 'ana@x.com', modelo, dados: { codigo: '123456', validadeMinutos: 10, link: 'https://app/r?token=a&b=<x>', ip: '1.2.3.4', restantes: 9 } });
      expect(enviados[0]).toMatchObject({ to: 'ana@x.com', from: { name: 'X', address: 'no-reply@x.com' } });
      expect(String(enviados[0]?.subject)).toContain('Oficina');
      expect(String(enviados[0]?.html)).toContain('lang="pt-BR"');
      expect(String(enviados[0]?.html)).not.toContain('<x>'); // escapado
      expect(String(enviados[0]?.text).length).toBeGreaterThan(10);
    },
  );
});
