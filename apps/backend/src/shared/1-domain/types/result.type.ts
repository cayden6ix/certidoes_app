/**
 * Tipo Result para tratamento de erros funcionais
 * Evita uso de exceptions para fluxos de negócio esperados
 * Segue o padrão de Either/Result pattern da programação funcional
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

/**
 * Alias para Result<void> com semanticamente mais claro
 */
export type VoidResult = Result<void>;

/**
 * Helper factory para criar resultado de sucesso
 * @param data - Os dados que serão retornados
 * @returns Result<T> com sucesso
 */
export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

/**
 * Helper factory para criar resultado de falha
 * @param error - Mensagem de erro
 * @param details - Detalhes opcionais do erro (ex: stacktrace, código)
 * @returns Result<T> com falha
 */
export const failure = <T>(
  error: string,
  details?: unknown,
): Result<T> => ({
  success: false,
  error,
  details,
});
