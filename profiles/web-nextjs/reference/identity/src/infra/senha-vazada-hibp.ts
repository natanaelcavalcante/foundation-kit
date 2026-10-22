import { createHash } from 'node:crypto';
import type { VerificadorSenhaVazada } from '../aplicacao/portas';

/**
 * Have I Been Pwned por k-anonymity: só os 5 primeiros caracteres do SHA-1 saem do servidor.
 * Se o serviço estiver fora, NÃO bloqueia o usuário (falha aberta) — a política de tamanho continua valendo.
 */
export class SenhaVazadaHibp implements VerificadorSenhaVazada {
  constructor(private readonly fetchFn: typeof fetch = fetch, private readonly timeoutMs = 2_000) {}

  async vazada(senha: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(senha).digest('hex').toUpperCase();
    const [prefixo, sufixo] = [sha1.slice(0, 5), sha1.slice(5)];
    try {
      const res = await this.fetchFn(`https://api.pwnedpasswords.com/range/${prefixo}`, {
        headers: { 'Add-Padding': 'true' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) return false;
      const corpo = await res.text();
      return corpo.split('\n').some((linha) => {
        const [suf, qtd] = linha.trim().split(':');
        return suf === sufixo && Number(qtd) > 0;
      });
    } catch {
      return false;
    }
  }
}
