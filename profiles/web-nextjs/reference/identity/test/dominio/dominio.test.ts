import { Id } from '@app/kernel';
import { describe, expect, it } from 'vitest';
import {
  CODIGO_EMAIL_INTERVALO_MS, CODIGO_EMAIL_VALIDADE_MS, DESAFIO_MAX_TENTATIVAS, DESAFIO_VALIDADE_MS, DesafioMfa,
} from '../../src/dominio/desafio-mfa.entity';
import { Email } from '../../src/dominio/email.vo';
import { BLOQUEIO_LOGIN_CONTA, duracaoBloqueio } from '../../src/dominio/politica-bloqueio.service';
import { SenhaNova } from '../../src/dominio/senha-nova.vo';
import { Usuario } from '../../src/dominio/usuario.entity';

const T0 = new Date('2026-03-01T12:00:00Z');
const mais = (ms: number) => new Date(T0.getTime() + ms);

describe('Email', () => {
  it('normaliza e mascara', () => {
    const e = Email.criar('  Natanael@Oficina.COM ').valor;
    expect(e.valor).toBe('natanael@oficina.com');
    expect(e.mascarado).toBe('nat***@oficina.com');
  });
  it.each(['', 'sem-arroba', 'a@b', 'a b@c.com', `${'a'.repeat(250)}@x.com`])('recusa %s', (v) => {
    expect(Email.criar(v).codigos).toEqual(['EMAIL_INVALIDO']);
  });
  it('recusa não-string', () => expect(Email.criar(undefined).codigos).toEqual(['EMAIL_OBRIGATORIO']));
});

describe('SenhaNova', () => {
  it('aceita 10 a 128 caracteres', () => {
    expect(SenhaNova.criar('a'.repeat(10)).ok).toBe(true);
    expect(SenhaNova.criar('a'.repeat(128)).ok).toBe(true);
  });
  it.each(['a'.repeat(9), 'a'.repeat(129), 42])('recusa %s', (v) => expect(SenhaNova.criar(v).codigos).toEqual(['SENHA_FRACA']));
  it('nunca aparece em JSON/log', () => expect(JSON.stringify({ s: SenhaNova.criar('segredo-muito-forte').valor })).toBe('{"s":"[REDACTED]"}'));
});

const usuario = (o: Partial<Parameters<typeof Usuario.restaurar>[0]> = {}) =>
  Usuario.restaurar({
    id: Id.novo(), email: Email.criar('a@b.com').valor, nome: 'A', senhaHash: 'h', status: 'ATIVO',
    mfa: { segredoCifrado: null, confirmado: false, metodoPreferido: 'TOTP', ultimoPassoTotp: null }, codigosRecuperacao: [], ...o,
  });

describe('Usuario', () => {
  it.each(['PENDENTE_VERIFICACAO', 'BLOQUEADO', 'DESATIVADO'] as const)('conta %s não pode autenticar', (status) => {
    expect(usuario({ status }).podeAutenticar().codigos).toEqual(['CONTA_INDISPONIVEL']);
  });

  it('cadastro de MFA: iniciar, confirmar e não permitir repetir', () => {
    const u = usuario();
    expect(u.confirmarMfa([], T0).codigos).toEqual(['MFA_NAO_INICIADO']);
    expect(u.iniciarCadastroMfa('cif').ok).toBe(true);
    expect(u.confirmarMfa(['h1', 'h2'], T0).ok).toBe(true);
    expect(u.mfa.confirmado).toBe(true);
    expect(u.codigosRecuperacaoRestantes).toBe(2);
    expect(u.iniciarCadastroMfa('outro').codigos).toEqual(['MFA_JA_CONFIGURADO']);
    expect(u.confirmarMfa([], T0).codigos).toEqual(['MFA_JA_CONFIGURADO']);
    expect(u.extrairEventos().map((e) => e.nome)).toEqual(['MfaAtivado']);
  });

  it('reiniciar o cadastro antes de confirmar zera o último passo TOTP', () => {
    const u = usuario({ mfa: { segredoCifrado: 'a', confirmado: false, metodoPreferido: 'TOTP', ultimoPassoTotp: 99 } });
    u.iniciarCadastroMfa('b');
    expect(u.mfa).toMatchObject({ segredoCifrado: 'b', ultimoPassoTotp: null });
  });

  it('código TOTP não pode ser reutilizado nem retroceder', () => {
    const u = usuario();
    expect(u.registrarPassoTotp(10).ok).toBe(true);
    expect(u.registrarPassoTotp(10).codigos).toEqual(['TOTP_REUTILIZADO']);
    expect(u.registrarPassoTotp(9).codigos).toEqual(['TOTP_REUTILIZADO']);
    expect(u.registrarPassoTotp(11).ok).toBe(true);
  });

  it('código de recuperação é de uso único', () => {
    const u = usuario({ codigosRecuperacao: ['h1', 'h2'] });
    expect(u.consumirCodigoRecuperacao('h1', T0).ok).toBe(true);
    expect(u.consumirCodigoRecuperacao('h1', T0).codigos).toEqual(['CODIGO_INVALIDO']);
    expect(u.hashesCodigosRecuperacao).toEqual(['h2']);
    expect(u.extrairEventos()[0]).toMatchObject({ nome: 'CodigoRecuperacaoUsado', dados: { restantes: 1 } });
  });

  it('método preferido TOTP exige MFA confirmado', () => {
    const u = usuario();
    expect(u.definirMetodoPreferido('TOTP').codigos).toEqual(['MFA_NAO_INICIADO']);
    expect(u.definirMetodoPreferido('EMAIL').ok).toBe(true);
    expect(u.mfa.metodoPreferido).toBe('EMAIL');
  });

  it('trocar senha registra evento', () => {
    const u = usuario();
    u.trocarSenha('novo', T0);
    expect(u.senhaHash).toBe('novo');
    expect(u.extrairEventos()[0]?.nome).toBe('SenhaAlterada');
  });
});

describe('DesafioMfa', () => {
  const novo = (tipo: 'CADASTRO' | 'VERIFICACAO' = 'VERIFICACAO') => DesafioMfa.criar({ usuarioId: Id.novo(), tipo, metodo: 'TOTP' }, T0);

  it('expira após a validade e só vale para o tipo certo', () => {
    const d = novo();
    expect(d.validoPara('VERIFICACAO', mais(DESAFIO_VALIDADE_MS - 1)).ok).toBe(true);
    expect(d.validoPara('VERIFICACAO', mais(DESAFIO_VALIDADE_MS)).codigos).toEqual(['DESAFIO_INVALIDO']);
    expect(d.validoPara('CADASTRO', T0).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it(`esgota após ${DESAFIO_MAX_TENTATIVAS} falhas`, () => {
    const d = novo();
    for (let i = 0; i < DESAFIO_MAX_TENTATIVAS - 1; i++) d.registrarFalha();
    expect(d.esgotado).toBe(false);
    d.registrarFalha();
    expect(d.esgotado).toBe(true);
    expect(d.validoPara('VERIFICACAO', T0).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it('código por e-mail: emitir, respeitar intervalo, validar uma vez, expirar', () => {
    const d = novo();
    expect(d.emitirCodigoEmail('h1', T0).ok).toBe(true);
    expect(d.metodo).toBe('EMAIL');
    expect(d.emitirCodigoEmail('h2', mais(CODIGO_EMAIL_INTERVALO_MS - 1)).codigos).toEqual(['CODIGO_REENVIO_MUITO_CEDO']);
    expect(d.verificarCodigoEmail('errado', T0).codigos).toEqual(['CODIGO_INVALIDO']);
    expect(d.verificarCodigoEmail('h1', T0).ok).toBe(true);
    expect(d.verificarCodigoEmail('h1', T0).codigos).toEqual(['CODIGO_INVALIDO']);

    expect(d.emitirCodigoEmail('h3', mais(CODIGO_EMAIL_INTERVALO_MS)).ok).toBe(true);
    expect(d.verificarCodigoEmail('h3', mais(CODIGO_EMAIL_INTERVALO_MS + CODIGO_EMAIL_VALIDADE_MS)).codigos).toEqual(['CODIGO_INVALIDO']);
  });

  it('desafio de cadastro não aceita código por e-mail', () => {
    expect(novo('CADASTRO').emitirCodigoEmail('h', T0).codigos).toEqual(['DESAFIO_INVALIDO']);
  });
});

describe('PoliticaBloqueio', () => {
  it('dobra a cada reincidência até o teto', () => {
    expect(duracaoBloqueio(BLOQUEIO_LOGIN_CONTA, 0)).toBe(15 * 60_000);
    expect(duracaoBloqueio(BLOQUEIO_LOGIN_CONTA, 1)).toBe(30 * 60_000);
    expect(duracaoBloqueio(BLOQUEIO_LOGIN_CONTA, 3)).toBe(120 * 60_000);
    expect(duracaoBloqueio(BLOQUEIO_LOGIN_CONTA, 50)).toBe(24 * 3_600_000);
    expect(duracaoBloqueio(BLOQUEIO_LOGIN_CONTA, -1)).toBe(15 * 60_000);
  });
});
