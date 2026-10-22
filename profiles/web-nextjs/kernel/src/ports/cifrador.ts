/** Criptografia de campo (AES-256-GCM, envelope). Implementação em packages/infra. */
export interface Cifrador {
  cifrar(textoClaro: string): Promise<string>;
  decifrar(cifrado: string): Promise<string>;
  /** HMAC-SHA256 com chave própria, para busca exata em campo cifrado (blind index). */
  indiceCego(valorNormalizado: string): string;
}
