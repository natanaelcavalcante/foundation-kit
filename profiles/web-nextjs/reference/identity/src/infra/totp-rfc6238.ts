import { createHmac, randomBytes } from 'node:crypto';
import type { ServicoTotp } from '../aplicacao/portas';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIODO_S = 30;
const DIGITOS = 6;
const JANELA = 1; // aceita o passo anterior e o seguinte (tolerância de relógio)

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let valor = 0;
  let saida = '';
  for (const byte of buf) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      saida += BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += BASE32[(valor << (5 - bits)) & 31];
  return saida;
}

export function base32Decode(texto: string): Buffer {
  const limpo = texto.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const c of limpo) {
    const i = BASE32.indexOf(c);
    if (i < 0) throw new Error('Segredo base32 inválido');
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function hotp(segredo: Buffer, contador: number, digitos = DIGITOS): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(contador));
  const hmac = createHmac('sha1', segredo).update(msg).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binario = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digitos;
  return binario.toString().padStart(digitos, '0');
}

/** TOTP compatível com Google Authenticator, Authy, Microsoft Authenticator (SHA-1, 6 dígitos, 30s). */
export class TotpRfc6238 implements ServicoTotp {
  constructor(private readonly emissor: string) {}

  gerarSegredo(): string {
    return base32Encode(randomBytes(20));
  }

  uri(segredo: string, conta: string): string {
    const rotulo = encodeURIComponent(`${this.emissor}:${conta}`);
    const params = new URLSearchParams({ secret: segredo, issuer: this.emissor, algorithm: 'SHA1', digits: String(DIGITOS), period: String(PERIODO_S) });
    return `otpauth://totp/${rotulo}?${params.toString()}`;
  }

  verificar(segredo: string, codigo: string, agora: Date): number | null {
    if (!/^\d{6}$/.test(codigo.trim())) return null;
    const chave = base32Decode(segredo);
    const passoAtual = Math.floor(agora.getTime() / 1000 / PERIODO_S);
    for (let delta = -JANELA; delta <= JANELA; delta++) {
      if (hotp(chave, passoAtual + delta) === codigo.trim()) return passoAtual + delta;
    }
    return null;
  }
}
