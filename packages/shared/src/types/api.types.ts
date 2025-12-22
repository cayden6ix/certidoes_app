/**
 * Tipos para respostas da API
 * Compartilhados entre frontend e backend
 */

/**
 * Resposta paginada genérica
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Resposta de erro da API
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Resposta de health check
 */
export interface HealthCheckResponse {
  status: string;
  env: string;
  timestamp: string;
}

/**
 * Filtros de listagem de certidões
 */
export interface CertificateFilters {
  search?: string;
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filtros adicionais para admin
 */
export interface AdminCertificateFilters extends CertificateFilters {
  userId?: string;
  paymentFrom?: string;
  paymentTo?: string;
}
