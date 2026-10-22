/** Abstrai o tempo para testes determinísticos. Nunca use `new Date()` no domínio/aplicação. */
export interface Relogio {
  agora(): Date;
}
