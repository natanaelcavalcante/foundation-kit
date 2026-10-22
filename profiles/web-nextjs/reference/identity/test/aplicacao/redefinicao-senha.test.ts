import { beforeEach, describe, expect, it } from 'vitest';
import { Autenticar } from '../../src/aplicacao/autenticar.use-case';
import { RedefinirSenha } from '../../src/aplicacao/redefinir-senha.use-case';
import { SolicitarRedefinicaoSenha, TOKEN_REDEFINICAO_VALIDADE_MS } from '../../src/aplicacao/solicitar-redefinicao-senha.use-case';
import { CTX, criarUsuarioComMfa, montar, type Deps } from '../fakes';

let d: Deps;
const solicitar = (email = 'ana@oficina.com', ctx = CTX) => new SolicitarRedefinicaoSenha(d).executar({ email }, ctx);
const redefinir = (token: string, novaSenha = 'nova-senha-forte-1') => new RedefinirSenha(d).executar({ token, novaSenha }, CTX);
const tokenDoEmail = () => new URL(String(d.email.ultimo('REDEFINIR_SENHA')?.dados.link)).searchParams.get('token')!;

beforeEach(() => { d = montar(); });

describe('Recuperação de senha', () => {
  it('Solicitação não revela existência do e-mail', async () => {
    await criarUsuarioComMfa(d);
    const existe = await solicitar();
    const naoExiste = await solicitar('ninguem@oficina.com');
    const malformado = await solicitar('xx');
    expect([existe.ok, naoExiste.ok, malformado.ok]).toEqual([true, true, true]);
    expect(d.email.enviados.map((e) => e.para)).toEqual(['ana@oficina.com']);
  });

  it('Conta inativa não recebe link', async () => {
    await criarUsuarioComMfa(d, { status: 'DESATIVADO' });
    expect((await solicitar()).ok).toBe(true);
    expect(d.email.enviados).toHaveLength(0);
  });

  it('Token é guardado só como hash', async () => {
    await criarUsuarioComMfa(d);
    await solicitar();
    expect([...d.tokensRedefinicao.dados.keys()]).not.toContain(tokenDoEmail());
  });

  it('Redefinição bem-sucedida', async () => {
    const u = await criarUsuarioComMfa(d);
    await d.sessoes.criar(u.id);
    await solicitar();
    expect((await redefinir(tokenDoEmail())).ok).toBe(true);
    expect((await d.usuarios.buscarPorId(u.id))?.senhaHash).toBe('hash:nova-senha-forte-1');
    expect(d.sessoes.ativas.size).toBe(0); // todas as sessões revogadas
    expect(d.email.ultimo('SENHA_ALTERADA')).toBeDefined();
    expect(d.auditoria.nomes()).toContain('SENHA_REDEFINIDA');
    const login = await new Autenticar(d).executar({ email: 'ana@oficina.com', senha: 'nova-senha-forte-1' }, CTX);
    expect(login.ok).toBe(true);
  });

  it('Burla: reutilizar o token', async () => {
    await criarUsuarioComMfa(d);
    await solicitar();
    const token = tokenDoEmail();
    expect((await redefinir(token)).ok).toBe(true);
    expect((await redefinir(token, 'outra-senha-forte')).codigos).toEqual(['TOKEN_INVALIDO']);
  });

  it('Token expira em 30 minutos', async () => {
    await criarUsuarioComMfa(d);
    await solicitar();
    d.relogio.avancar(TOKEN_REDEFINICAO_VALIDADE_MS);
    expect((await redefinir(tokenDoEmail())).codigos).toEqual(['TOKEN_INVALIDO']);
  });

  it('Burla: token inventado ou vazio', async () => {
    expect((await redefinir('inventado')).codigos).toEqual(['TOKEN_INVALIDO']);
    expect((await redefinir('')).codigos).toEqual(['TOKEN_INVALIDO']);
  });

  it('Senha fraca ou vazada é recusada antes de consumir o token', async () => {
    await criarUsuarioComMfa(d);
    await solicitar();
    const token = tokenDoEmail();
    expect((await redefinir(token, 'curta')).codigos).toEqual(['SENHA_FRACA']);
    expect((await redefinir(token, 'senha123456')).codigos).toEqual(['SENHA_VAZADA']);
    expect((await redefinir(token)).ok).toBe(true); // token continuava válido
  });

  it('Redefinir senha desbloqueia a conta para login', async () => {
    await criarUsuarioComMfa(d);
    for (let i = 0; i < 5; i++) await new Autenticar(d).executar({ email: 'ana@oficina.com', senha: 'errada' }, CTX);
    await solicitar();
    await redefinir(tokenDoEmail());
    expect(d.limitador.falhas.has('login:conta:ana@oficina.com')).toBe(false);
  });

  it('Limite de solicitações por conta: excedeu, para de enviar (sem avisar)', async () => {
    await criarUsuarioComMfa(d);
    for (let i = 0; i < 5; i++) expect((await solicitar()).ok).toBe(true);
    expect(d.email.enviados.filter((e) => e.modelo === 'REDEFINIR_SENHA')).toHaveLength(3);
  });
});

describe('Rate limiting e bloqueio progressivo', () => {
  const login = (senha: string, ctx = CTX) => new Autenticar(d).executar({ email: 'ana@oficina.com', senha }, ctx);

  it('Força bruta em uma conta', async () => {
    await criarUsuarioComMfa(d);
    for (let i = 0; i < 5; i++) expect((await login('errada')).codigos).toEqual(['CREDENCIAIS_INVALIDAS']);
    const bloqueado = await login('senha-correta-123');
    expect(bloqueado.codigos).toEqual(['TENTATIVAS_EXCEDIDAS']); // mesmo com a senha correta
    expect(d.email.ultimo('CONTA_BLOQUEADA')).toBeDefined();
  });

  it('Bloqueio dobra na reincidência', async () => {
    await criarUsuarioComMfa(d);
    for (let i = 0; i < 5; i++) await login('errada');
    d.relogio.avancar(15 * 60_000);
    expect((await login('senha-correta-123')).ok).toBe(true);
    for (let i = 0; i < 5; i++) await login('errada');
    d.relogio.avancar(15 * 60_000);
    expect((await login('senha-correta-123')).codigos).toEqual(['TENTATIVAS_EXCEDIDAS']);
    d.relogio.avancar(15 * 60_000);
    expect((await login('senha-correta-123')).ok).toBe(true);
  });

  it('Credential stuffing de um IP', async () => {
    for (let i = 0; i < 20; i++) await new Autenticar(d).executar({ email: `vitima${i}@x.com`, senha: 'x' }, CTX);
    await criarUsuarioComMfa(d);
    expect((await login('senha-correta-123')).codigos).toEqual(['TENTATIVAS_EXCEDIDAS']);
    expect((await login('senha-correta-123', { ...CTX, ip: '198.51.100.1' })).ok).toBe(true);
  });

  it('Sucesso zera contador', async () => {
    await criarUsuarioComMfa(d);
    for (let i = 0; i < 4; i++) await login('errada');
    await login('senha-correta-123');
    for (let i = 0; i < 4; i++) await login('errada');
    expect((await login('senha-correta-123')).ok).toBe(true);
  });
});
