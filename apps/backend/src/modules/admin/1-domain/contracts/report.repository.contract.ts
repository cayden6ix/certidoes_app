import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Filtros disponíveis para geração de relatórios
 * Filtros padrão: tipo de certidão, ficha, status, tags, tipo de pagamento, data de pagamento
 * Filtros opcionais: nº do pedido, usuário, comentário, observações, nome das partes
 */
export interface ReportFilters {
  // Filtros padrão
  certificateTypeId?: string;
  recordNumber?: string;
  statusId?: string;
  tagIds?: string[];
  paymentTypeId?: string;
  paymentDateFrom?: Date;
  paymentDateTo?: Date;

  // Filtros opcionais
  orderNumber?: string;
  userId?: string;
  commentSearch?: string;
  notesSearch?: string;
  partiesNameSearch?: string;
}

/**
 * Quebra por status para dashboard
 */
export interface StatusBreakdown {
  statusId: string;
  statusName: string;
  statusDisplayName: string;
  statusColor: string;
  count: number;
  totalCost: number;
}

/**
 * Quebra por tipo de certidão para dashboard
 */
export interface TypeBreakdown {
  typeId: string;
  typeName: string;
  count: number;
  totalCost: number;
}

/**
 * Quebra por período (mês) para dashboard
 */
export interface PeriodBreakdown {
  period: string; // Formato: 'YYYY-MM'
  count: number;
  totalCost: number;
}

/**
 * Quebra por prioridade para dashboard
 */
export interface PriorityBreakdown {
  priority: 'normal' | 'urgent';
  count: number;
}

/**
 * Métricas agregadas do relatório para dashboard
 */
export interface ReportMetrics {
  totalCertificates: number;
  totalCost: number; // em centavos
  totalAdditionalCost: number; // em centavos
  totalCombined: number; // em centavos (cost + additionalCost)
  byStatus: StatusBreakdown[];
  byType: TypeBreakdown[];
  byPeriod: PeriodBreakdown[];
  byPriority: PriorityBreakdown[];
}

/**
 * Dados de uma certidão para exibição no relatório
 */
export interface ReportCertificateData {
  id: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  statusId: string;
  statusName: string;
  statusDisplayName: string;
  statusColor: string;
  cost: number | null;
  additionalCost: number | null;
  paymentDate: string | null;
  createdAt: string;
}

/**
 * Resultado paginado de certidões do relatório
 */
export interface PaginatedReportCertificates {
  data: ReportCertificateData[];
  total: number;
}

/**
 * Parâmetros de paginação
 */
export interface ReportPaginationParams {
  limit: number;
  offset: number;
}

/**
 * Token de injeção de dependência para o repositório de relatórios
 */
export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

/**
 * Contrato para repositório de relatórios
 * Define as operações de consulta e agregação para relatórios administrativos
 */
export interface ReportRepositoryContract {
  /**
   * Retorna métricas agregadas para o dashboard de relatórios
   * Inclui totais, quebras por status/tipo/período/prioridade
   */
  getMetrics(filters: ReportFilters): Promise<Result<ReportMetrics>>;

  /**
   * Retorna lista paginada de certidões filtradas para exibição no relatório
   */
  getCertificates(
    filters: ReportFilters,
    pagination: ReportPaginationParams,
  ): Promise<Result<PaginatedReportCertificates>>;
}
