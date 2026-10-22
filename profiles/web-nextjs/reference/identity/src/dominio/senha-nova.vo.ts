import { falha, Result, ValueObject } from '@app/kernel';

export const SENHA_MINIMO = 10;
export const SENHA_MAXIMO = 128;

/**
 * Senha em texto claro escolhida pelo usuário, validada pela política (tamanho).
 * Nunca é persistida: o caso de uso gera o hash e descarta o VO.
 * A checagem contra senhas vazadas é feita pela porta `VerificadorSenhaVazada`.
 */
export class SenhaNova extends ValueObject<string> {
  private constructor(valor: string) {
    super(valor);
  }

  static criar(bruto: unknown, campo = 'senha'): Result<SenhaNova> {
    if (typeof bruto !== 'string' || bruto.length < SENHA_MINIMO || bruto.length > SENHA_MAXIMO) {
      return Result.fail(falha('SENHA_FRACA', 'validacao', { campo, detalhes: { minimo: SENHA_MINIMO, maximo: SENHA_MAXIMO } }));
    }
    return Result.ok(new SenhaNova(bruto));
  }

  override toJSON(): string {
    return '[REDACTED]';
  }
}
