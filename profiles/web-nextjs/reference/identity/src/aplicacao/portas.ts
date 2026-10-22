import type { Cifrador, Id, Relogio } from '@app/kernel';
import type { DesafioMfa } from '../dominio/desafio-mfa.entity';
import type { Email } from '../dominio/email.vo';
import type { ConfigBloqueio } from '../dominio/politica-bloqueio.service';
import type { Usuario } from '../dominio/usuario.entity';

/** Rotas de autenticação são públicas: não há usuário, mas há origem para rate limit e auditoria. */
export interface ContextoPublico {
  readonly ip: string;
  readonly userAgent: string;
  readonly traceId: string;
}

export interface UsuarioRepository {
  buscarPorEmail(email: Email): Promise<Usuario | null>;
  buscarPorId(id: Id): Promise<Usuario | null>;
  salvar(usuario: Usuario): Promise<void>;
}

export interface DesafioMfaStore {
  salvar(desafio: DesafioMfa): Promise<void>;
  buscar(id: Id): Promise<DesafioMfa | null>;
  remover(id: Id): Promise<void>;
}

export interface HasherSenha {
  hash(senha: string): Promise<string>;
  verificar(hash: string, senha: string): Promise<boolean>;
  /** Hash válido de uma senha aleatória: verificado quando o e-mail não existe, igualando o tempo de resposta. */
  readonly hashFicticio: string;
}

export interface VerificadorSenhaVazada {
  vazada(senha: string): Promise<boolean>;
}

export interface ServicoTotp {
  gerarSegredo(): string;
  uri(segredo: string, conta: string): string;
  /** Retorna o passo (contador de 30s) aceito, ou `null` se o código não confere na janela ±1. */
  verificar(segredo: string, codigo: string, agora: Date): number | null;
}

export interface EstadoLimite {
  bloqueadoAte: Date | null;
}

export interface LimitadorTentativas {
  estado(chave: string, agora: Date): Promise<EstadoLimite>;
  /** Registra uma falha; retorna `true` se esta falha disparou um novo bloqueio. */
  registrarFalha(chave: string, config: ConfigBloqueio, agora: Date): Promise<boolean>;
  limpar(chave: string): Promise<void>;
}

export interface SessaoStore {
  criar(usuarioId: Id, origem: { ip: string; userAgent: string }): Promise<string>;
  revogarTodas(usuarioId: Id): Promise<void>;
}

export interface TokenRedefinicaoStore {
  salvar(hashToken: string, usuarioId: Id, expiraEm: Date): Promise<void>;
  /** Busca e remove atomicamente (uso único). */
  consumir(hashToken: string, agora: Date): Promise<Id | null>;
}

export type ModeloEmail = 'CODIGO_MFA' | 'REDEFINIR_SENHA' | 'SENHA_ALTERADA' | 'CONTA_BLOQUEADA' | 'MFA_ATIVADO' | 'CODIGO_RECUPERACAO_USADO';

export interface EnviadorEmail {
  enviar(mensagem: { para: string; modelo: ModeloEmail; dados: Record<string, string | number> }): Promise<void>;
}

export interface GeradorAleatorio {
  /** 32 bytes aleatórios em base64url. */
  token(): string;
  codigoNumerico(digitos: number): string;
  /** Formato `XXXX-XXXX` (alfabeto sem caracteres ambíguos). */
  codigoRecuperacao(): string;
}

export interface Auditoria {
  registrar(evento: string, dados: Record<string, unknown>): Promise<void>;
}

export interface DependenciasIdentity {
  usuarios: UsuarioRepository;
  desafios: DesafioMfaStore;
  hasher: HasherSenha;
  senhasVazadas: VerificadorSenhaVazada;
  totp: ServicoTotp;
  limitador: LimitadorTentativas;
  sessoes: SessaoStore;
  tokensRedefinicao: TokenRedefinicaoStore;
  email: EnviadorEmail;
  aleatorio: GeradorAleatorio;
  cifrador: Cifrador;
  auditoria: Auditoria;
  relogio: Relogio;
  config: { mfaObrigatorio: boolean; urlApp: string; nomeApp: string };
}
