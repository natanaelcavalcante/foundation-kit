/** Unidade de trabalho: o adapter propaga a transação (e o tenant para RLS) aos repositórios. */
export interface GerenciadorTransacao {
  executar<T>(fn: () => Promise<T>): Promise<T>;
}
