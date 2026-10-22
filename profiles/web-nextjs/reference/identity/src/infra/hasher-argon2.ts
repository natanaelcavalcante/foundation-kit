import { hash, verify } from '@node-rs/argon2';
import type { HasherSenha } from '../aplicacao/portas';

/** Argon2id com os parâmetros recomendados pela OWASP (m=19MiB, t=2, p=1). */
const OPCOES = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export class HasherArgon2 implements HasherSenha {
  private constructor(readonly hashFicticio: string) {}

  static async criar(): Promise<HasherArgon2> {
    return new HasherArgon2(await hash(crypto.randomUUID(), OPCOES));
  }

  hash(senha: string): Promise<string> {
    return hash(senha, OPCOES);
  }

  async verificar(h: string, senha: string): Promise<boolean> {
    try {
      return await verify(h, senha);
    } catch {
      return false;
    }
  }
}
