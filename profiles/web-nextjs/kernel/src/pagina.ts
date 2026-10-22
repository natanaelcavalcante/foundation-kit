export interface PaginaEntrada {
  readonly pagina: number;
  readonly tamanho: number;
}

export interface Pagina<T> {
  readonly itens: readonly T[];
  readonly total: number;
  readonly pagina: number;
  readonly tamanho: number;
}

export const TAMANHO_MAXIMO_PAGINA = 100;

export const normalizarPagina = (p: Partial<PaginaEntrada> = {}): PaginaEntrada => ({
  pagina: Math.max(1, Math.trunc(p.pagina ?? 1)),
  tamanho: Math.min(TAMANHO_MAXIMO_PAGINA, Math.max(1, Math.trunc(p.tamanho ?? 20))),
});
