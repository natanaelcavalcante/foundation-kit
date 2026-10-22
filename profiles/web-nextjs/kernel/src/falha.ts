/** Categoria da falha: a camada de interface traduz para HTTP/UI. */
export type TipoFalha =
  | 'validacao' // 422
  | 'regra_negocio' // 422
  | 'nao_encontrado' // 404 (também usado para recursos de outro tenant — não revela existência)
  | 'conflito' // 409
  | 'nao_autenticado' // 401
  | 'proibido' // 403
  | 'limite_excedido'; // 429

export interface Falha {
  /** Código estável em SCREAMING_SNAKE_CASE, usado em testes, i18n e clientes. */
  readonly codigo: string;
  readonly tipo: TipoFalha;
  readonly campo?: string;
  readonly detalhes?: Readonly<Record<string, unknown>>;
}

export const falha = (codigo: string, tipo: TipoFalha, extra: Omit<Falha, 'codigo' | 'tipo'> = {}): Falha => ({
  codigo,
  tipo,
  ...extra,
});

export const HTTP_POR_TIPO: Readonly<Record<TipoFalha, number>> = {
  validacao: 422,
  regra_negocio: 422,
  nao_encontrado: 404,
  conflito: 409,
  nao_autenticado: 401,
  proibido: 403,
  limite_excedido: 429,
};
