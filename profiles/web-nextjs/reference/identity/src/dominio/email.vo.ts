import { falha, Result, ValueObject } from '@app/kernel';

const FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<string> {
  private constructor(valor: string) {
    super(valor);
  }

  static criar(bruto: unknown, campo = 'email'): Result<Email> {
    if (typeof bruto !== 'string') return Result.fail(falha('EMAIL_OBRIGATORIO', 'validacao', { campo }));
    const normalizado = bruto.trim().toLowerCase();
    if (normalizado.length > 254 || !FORMATO.test(normalizado)) {
      return Result.fail(falha('EMAIL_INVALIDO', 'validacao', { campo }));
    }
    return Result.ok(new Email(normalizado));
  }

  /** `nat***@dominio.com` — para exibir em telas de desafio sem expor o endereço completo. */
  get mascarado(): string {
    const [local = '', dominio = ''] = this.valor.split('@');
    return `${local.slice(0, 3)}***@${dominio}`;
  }
}
