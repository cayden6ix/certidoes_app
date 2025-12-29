import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  ReportRepositoryContract,
  ReportFilters,
  ReportMetrics,
} from '../../../1-domain/contracts/report.repository.contract';

/**
 * Parâmetros para busca de métricas do relatório
 * Aceita datas como strings ISO para facilitar a conversão no controller
 */
export interface GetReportMetricsParams {
  certificateTypeId?: string;
  recordNumber?: string;
  statusId?: string;
  tagIds?: string[];
  paymentTypeId?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  orderNumber?: string;
  userId?: string;
  commentSearch?: string;
  notesSearch?: string;
  partiesNameSearch?: string;
}

/**
 * Caso de uso para obter métricas agregadas do relatório
 * Responsabilidade única: orquestrar a geração de métricas para o dashboard
 */
export class GetReportMetricsUseCase {
  constructor(
    private readonly repository: ReportRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: GetReportMetricsParams): Promise<Result<ReportMetrics>> {
    const activeFilters = Object.keys(params).filter(
      (key) => params[key as keyof GetReportMetricsParams] !== undefined,
    );

    this.logger.debug('Gerando métricas do relatório', {
      activeFilters,
      filterCount: activeFilters.length,
    });

    const filters = this.mapToReportFilters(params);

    return this.repository.getMetrics(filters);
  }

  /**
   * Converte os parâmetros de entrada para o formato do contrato
   * Transforma strings de data em objetos Date
   */
  private mapToReportFilters(params: GetReportMetricsParams): ReportFilters {
    return {
      certificateTypeId: params.certificateTypeId,
      recordNumber: params.recordNumber,
      statusId: params.statusId,
      tagIds: params.tagIds,
      paymentTypeId: params.paymentTypeId,
      paymentDateFrom: params.paymentDateFrom ? new Date(params.paymentDateFrom) : undefined,
      paymentDateTo: params.paymentDateTo ? new Date(params.paymentDateTo) : undefined,
      orderNumber: params.orderNumber,
      userId: params.userId,
      commentSearch: params.commentSearch,
      notesSearch: params.notesSearch,
      partiesNameSearch: params.partiesNameSearch,
    };
  }
}
