import { Id } from '@app/kernel';
import { beforeEach, describe, expect, it } from 'vitest';
import { Autenticar } from '../../src/aplicacao/autenticar.use-case';
import { ConfirmarCadastroMfa } from '../../src/aplicacao/confirmar-cadastro-mfa.use-case';
import { SolicitarCodigoEmail } from '../../src/aplicacao/solicitar-codigo-email.use-case';
import { VerificarMfa } from '../../src/aplicacao/verificar-mfa.use-case';
import { DESAFIO_VALIDADE_MS } from '../../src/dominio/desafio-mfa.entity';
import { Usuario } from '../../src/dominio/usuario.entity';
import { CTX, criarUsuario, criarUsuarioComMfa, montar, SENHA, TotpFake, type Deps } from '../fakes';

let d: Deps;
const autenticar = (email = 'ana@oficina.com', senha = SENHA, ctx = CTX) => new Autenticar(d).executar({ email, senha }, ctx);
const verificar = (desafioId: string, codigo: string, metodo: 'TOTP' | 'EMAIL' | 'RECUPERACAO' = 'TOTP') =>
  new VerificarMfa(d).executar({ desafioId, codigo, metodo }, CTX);
const codigoAgora = () => TotpFake.codigoPara(d.relogio.agora());

beforeEach(() => { d = montar(); });

describe('Login seguro', () => {
  it('Credenciais inválidas', async () => {
    await criarUsuarioComMfa(d);
    const senhaErrada = await autenticar('ana@oficina.com', 'errada');
    const emailInexistente = await autenticar('ninguem@oficina.com', SENHA);
    expect(senhaErrada.codigos).toEqual(['CREDENCIAIS_INVALIDAS']);
    expect(emailInexistente.codigos).toEqual(['CREDENCIAIS_INVALIDAS']);
    expect(d.hasher.verificacoes).toBe(2); // e-mail inexistente também verifica hash (tempo igual)
    expect(d.auditoria.nomes()).toEqual(['LOGIN_FALHA', 'LOGIN_FALHA']);
  });

  it('E-mail malformado responde como credencial inválida, sem consultar o banco', async () => {
    expect((await autenticar('nao-e-email')).codigos).toEqual(['CREDENCIAIS_INVALIDAS']);
    expect(d.hasher.verificacoes).toBe(0);
  });

  it.each(['PENDENTE_VERIFICACAO', 'BLOQUEADO', 'DESATIVADO'] as const)('Conta %s não autentica', async (status) => {
    await criarUsuarioComMfa(d, { status });
    expect((await autenticar()).codigos).toEqual(['CONTA_INDISPONIVEL']);
    expect(d.sessoes.ativas.size).toBe(0);
  });

  it('Senha correta nunca emite sessão antes do MFA', async () => {
    await criarUsuarioComMfa(d);
    const r = await autenticar();
    expect(r.valor).toMatchObject({ etapa: 'MFA_DESAFIO', metodo: 'TOTP', emailMascarado: 'ana***@oficina.com' });
    expect(d.sessoes.ativas.size).toBe(0);
  });

  it('Sem MFA obrigatório, usuário sem MFA recebe sessão direto', async () => {
    d = montar({ mfaObrigatorio: false });
    await criarUsuario(d);
    expect((await autenticar()).valor).toEqual({ etapa: 'SESSAO', token: 'sessao-1' });
  });
});

describe('MFA por TOTP — primeiro acesso (fluxo NexusCMS)', () => {
  it('Papel exige MFA: primeiro login força o cadastro do app autenticador', async () => {
    const u = await criarUsuario(d);
    const r = await autenticar();
    expect(r.valor).toMatchObject({ etapa: 'MFA_CADASTRO', segredo: 'SEGREDO', uri: expect.stringContaining('otpauth://') });
    const salvo = await d.usuarios.buscarPorId(u.id);
    expect(salvo?.mfa.segredoCifrado).toMatch(/^cifrado:/); // nunca em claro
    expect(d.sessoes.ativas.size).toBe(0);
  });

  it('Confirmar cadastro com código válido ativa MFA, emite sessão e 10 códigos de recuperação', async () => {
    const u = await criarUsuario(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    const r = await new ConfirmarCadastroMfa(d).executar({ desafioId, codigo: codigoAgora() }, CTX);
    expect(r.valor.token).toBe('sessao-1');
    expect(r.valor.codigosRecuperacao).toHaveLength(10);
    const salvo = await d.usuarios.buscarPorId(u.id);
    expect(salvo?.mfa.confirmado).toBe(true);
    expect(salvo?.hashesCodigosRecuperacao).not.toContain(r.valor.codigosRecuperacao[0]); // guardados só como hash
    expect(d.desafios.dados.size).toBe(0);
    expect(d.email.ultimo('MFA_ATIVADO')).toBeDefined();
  });

  it('Confirmar cadastro com código errado não ativa e conta tentativa', async () => {
    await criarUsuario(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    const r = await new ConfirmarCadastroMfa(d).executar({ desafioId, codigo: '000000' }, CTX);
    expect(r.codigos).toEqual(['CODIGO_INVALIDO']);
    expect(r.falhas[0]?.detalhes).toEqual({ tentativasRestantes: 4 });
    expect(d.sessoes.ativas.size).toBe(0);
  });

  it('Burla: usar desafio de cadastro na rota de verificação', async () => {
    await criarUsuario(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(desafioId, codigoAgora())).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it('Burla: confirmar cadastro com desafio de verificação', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    expect((await new ConfirmarCadastroMfa(d).executar({ desafioId, codigo: codigoAgora() }, CTX)).codigos).toEqual(['DESAFIO_INVALIDO']);
  });
});

describe('MFA por TOTP — login', () => {
  it('Login com MFA', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    const r = await verificar(desafioId, codigoAgora());
    expect(r.valor).toEqual({ token: 'sessao-1', codigosRecuperacaoRestantes: 0 });
    expect(d.auditoria.nomes()).toContain('LOGIN_SUCESSO');
    expect(d.desafios.dados.size).toBe(0); // desafio de uso único
  });

  it('Aceita o código do passo anterior (tolerância de relógio)', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(desafioId, TotpFake.codigoPara(d.relogio.agora(), -1))).ok).toBe(true);
  });

  it('Reuso de código TOTP', async () => {
    await criarUsuarioComMfa(d);
    const codigo = codigoAgora();
    const primeiro = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(primeiro.desafioId, codigo)).ok).toBe(true);
    const segundo = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(segundo.desafioId, codigo)).codigos).toEqual(['CODIGO_INVALIDO']);
  });

  it('Desafio esgota após 5 códigos errados e o login recomeça', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    for (let i = 0; i < 4; i++) expect((await verificar(desafioId, '000000')).codigos).toEqual(['CODIGO_INVALIDO']);
    expect((await verificar(desafioId, '000000')).codigos).toEqual(['DESAFIO_ESGOTADO']);
    expect((await verificar(desafioId, codigoAgora())).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it('Desafio expira em 10 minutos', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    d.relogio.avancar(DESAFIO_VALIDADE_MS);
    expect((await verificar(desafioId, codigoAgora())).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it('Burla: desafioId inexistente ou malformado', async () => {
    expect((await verificar(Id.novo().valor, '123456')).codigos).toEqual(['DESAFIO_INVALIDO']);
    expect((await verificar('../../etc', '123456')).codigos).toEqual(['DESAFIO_INVALIDO']);
  });

  it('Burla: conta desativada entre a senha e o MFA', async () => {
    const u = await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    await d.usuarios.salvar(Usuario.restaurar({
      id: u.id, email: u.email, nome: u.nome, senhaHash: u.senhaHash, status: 'DESATIVADO', mfa: { ...u.mfa }, codigosRecuperacao: [],
    }));
    expect((await verificar(desafioId, codigoAgora())).codigos).toEqual(['DESAFIO_INVALIDO']);
    expect(d.desafios.dados.size).toBe(0);
  });

  it('Método desconhecido é recusado', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(desafioId, '1', 'SMS' as never)).codigos).toEqual(['METODO_INVALIDO']);
  });
});

describe('MFA — código por e-mail (alternativa ao app)', () => {
  it('Usuário com preferência EMAIL recebe o código já no login', async () => {
    await criarUsuarioComMfa(d, { mfa: { metodoPreferido: 'EMAIL' } });
    const r = await autenticar();
    expect(r.valor).toMatchObject({ etapa: 'MFA_DESAFIO', metodo: 'EMAIL' });
    const codigo = String(d.email.ultimo('CODIGO_MFA')?.dados.codigo);
    expect((await verificar((r.valor as { desafioId: string }).desafioId, codigo, 'EMAIL')).ok).toBe(true);
  });

  it('Solicitar código por e-mail durante o desafio', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    const r = await new SolicitarCodigoEmail(d).executar({ desafioId });
    expect(r.valor).toEqual({ emailMascarado: 'ana***@oficina.com' });
    const codigo = String(d.email.ultimo('CODIGO_MFA')?.dados.codigo);
    expect((await verificar(desafioId, codigo, 'EMAIL')).ok).toBe(true);
  });

  it('Reenvio antes de 60s é recusado', async () => {
    await criarUsuarioComMfa(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    await new SolicitarCodigoEmail(d).executar({ desafioId });
    expect((await new SolicitarCodigoEmail(d).executar({ desafioId })).codigos).toEqual(['CODIGO_REENVIO_MUITO_CEDO']);
    expect(d.email.enviados.filter((e) => e.modelo === 'CODIGO_MFA')).toHaveLength(1);
  });

  it('Burla: código por e-mail de outro desafio não vale', async () => {
    await criarUsuarioComMfa(d);
    const a = (await autenticar()).valor as { desafioId: string };
    await new SolicitarCodigoEmail(d).executar({ desafioId: a.desafioId });
    const codigoA = String(d.email.ultimo('CODIGO_MFA')?.dados.codigo);
    const b = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(b.desafioId, codigoA, 'EMAIL')).codigos).toEqual(['CODIGO_INVALIDO']);
  });

  it('Burla: pedir código por e-mail para desafio de cadastro', async () => {
    await criarUsuario(d);
    const { desafioId } = (await autenticar()).valor as { desafioId: string };
    expect((await new SolicitarCodigoEmail(d).executar({ desafioId })).codigos).toEqual(['DESAFIO_INVALIDO']);
  });
});

describe('MFA — códigos de recuperação', () => {
  it('Código de recuperação entra uma única vez e avisa por e-mail', async () => {
    await criarUsuario(d);
    const cad = (await autenticar()).valor as { desafioId: string };
    const { codigosRecuperacao } = (await new ConfirmarCadastroMfa(d).executar({ desafioId: cad.desafioId, codigo: codigoAgora() }, CTX)).valor;
    const codigo = codigosRecuperacao[0]!.toLowerCase(); // aceita minúsculas

    const a = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(a.desafioId, codigo, 'RECUPERACAO')).valor.codigosRecuperacaoRestantes).toBe(9);
    expect(d.email.ultimo('CODIGO_RECUPERACAO_USADO')?.dados.restantes).toBe(9);

    const b = (await autenticar()).valor as { desafioId: string };
    expect((await verificar(b.desafioId, codigo, 'RECUPERACAO')).codigos).toEqual(['CODIGO_INVALIDO']);
  });
});
