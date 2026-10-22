import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import type { Cifrador } from '@app/kernel';

export interface ChavesCifrador {
  /** versão → chave de 32 bytes. Mantenha versões antigas enquanto houver dados cifrados com elas. */
  chaves: Record<number, Buffer>;
  versaoEscrita: number;
  /** Chave separada (32 bytes) para HMAC do índice cego. */
  chaveIndice: Buffer;
}

/**
 * AES-256-GCM por campo. Formato: `v{versao}:{iv_b64url}:{ciphertext+tag_b64url}`.
 * Em produção as chaves vêm de um cofre/KMS (envelope); em dev, de variáveis de ambiente.
 */
export class CifradorAesGcm implements Cifrador {
  constructor(private readonly k: ChavesCifrador) {
    for (const [v, chave] of Object.entries(k.chaves)) if (chave.length !== 32) throw new Error(`Chave v${v} deve ter 32 bytes`);
    if (!k.chaves[k.versaoEscrita]) throw new Error('Versão de escrita sem chave');
    if (k.chaveIndice.length !== 32) throw new Error('Chave de índice deve ter 32 bytes');
  }

  static doAmbiente(env: Record<string, string | undefined>): CifradorAesGcm {
    const ler = (nome: string) => {
      const v = env[nome];
      if (!v) throw new Error(`Variável ${nome} ausente`);
      return Buffer.from(v, 'base64');
    };
    const versao = Number(env.CHAVE_VERSAO ?? '1');
    const chaves: Record<number, Buffer> = { [versao]: ler('CHAVE_MESTRA') };
    if (env.CHAVE_MESTRA_ANTERIOR) chaves[versao - 1] = ler('CHAVE_MESTRA_ANTERIOR');
    return new CifradorAesGcm({ chaves, versaoEscrita: versao, chaveIndice: ler('CHAVE_INDICE') });
  }

  async cifrar(textoClaro: string): Promise<string> {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.k.chaves[this.k.versaoEscrita]!, iv);
    const ct = Buffer.concat([cipher.update(textoClaro, 'utf8'), cipher.final(), cipher.getAuthTag()]);
    return `v${this.k.versaoEscrita}:${iv.toString('base64url')}:${ct.toString('base64url')}`;
  }

  async decifrar(cifrado: string): Promise<string> {
    const m = /^v(\d+):([\w-]+):([\w-]+)$/.exec(cifrado);
    if (!m) throw new Error('Formato cifrado inválido');
    const chave = this.k.chaves[Number(m[1])];
    if (!chave) throw new Error(`Chave v${m[1]} indisponível`);
    const dados = Buffer.from(m[3]!, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', chave, Buffer.from(m[2]!, 'base64url'));
    decipher.setAuthTag(dados.subarray(dados.length - 16));
    return Buffer.concat([decipher.update(dados.subarray(0, dados.length - 16)), decipher.final()]).toString('utf8');
  }

  /** Precisa re-cifrar? (dado gravado com versão antiga) — usado pelo job de rotação. */
  versaoDe(cifrado: string): number {
    return Number(/^v(\d+):/.exec(cifrado)?.[1] ?? NaN);
  }

  indiceCego(valorNormalizado: string): string {
    return createHmac('sha256', this.k.chaveIndice).update(valorNormalizado, 'utf8').digest('base64url');
  }
}
