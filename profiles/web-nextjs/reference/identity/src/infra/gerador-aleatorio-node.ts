import { randomBytes, randomInt } from 'node:crypto';
import type { GeradorAleatorio } from '../aplicacao/portas';

const ALFABETO_RECUPERACAO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O, 1/I

export class GeradorAleatorioNode implements GeradorAleatorio {
  token(): string {
    return randomBytes(32).toString('base64url');
  }

  codigoNumerico(digitos: number): string {
    return Array.from({ length: digitos }, () => randomInt(0, 10)).join('');
  }

  codigoRecuperacao(): string {
    const c = Array.from({ length: 8 }, () => ALFABETO_RECUPERACAO[randomInt(0, ALFABETO_RECUPERACAO.length)]).join('');
    return `${c.slice(0, 4)}-${c.slice(4)}`;
  }
}
