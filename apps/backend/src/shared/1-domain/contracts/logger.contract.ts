/**
 * Contrato para serviço de logging
 * Implementado na camada de infraestrutura
 */
export interface LoggerContract {
  /**
   * Log de informação - operações bem-sucedidas, eventos de negócio
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log de aviso - situações recuperáveis, degradação
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log de erro - falhas que precisam de atenção
   */
  error(message: string, context?: Record<string, unknown>): void;

  /**
   * Log de debug - informações para desenvolvimento
   */
  debug(message: string, context?: Record<string, unknown>): void;
}

export const LOGGER_CONTRACT = Symbol('LoggerContract');
