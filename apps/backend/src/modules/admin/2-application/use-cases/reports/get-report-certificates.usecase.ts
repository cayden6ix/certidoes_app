import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  ReportRepositoryContract,
  ReportFilters,
  PaginatedReportCertificates,
} from '../../../1-domain/contracts/report.repository.contract';

/**
 * Parâmetros para busca de certidões do relatório
 * Aceita datas como strings ISO para facilitar a conversão no controller
 */
export interface GetReportCertificatesParams {
  // Filtros
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

  // Paginação
  limit: number;
  offset: number;
}

/**
 * Caso de uso para listar certidões filtradas do relatório
 * Responsabilidade única: orquestrar a busca de certidões para o relatório
 */
export class GetReportCertificatesUseCase {
  constructor(
    private readonly repository: ReportRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: GetReportCertificatesParams): Promise<Result<PaginatedReportCertificates>> {
    const activeFilters = Object.keys(params).filter(
      (key) =>
        key !== 'limit' &&
        key !== 'offset' &&
        params[key as keyof GetReportCertificatesParams] !== undefined,
    );

    this.logger.debug('Listando certidões do relatório', {
      activeFilters,
      filterCount: activeFilters.length,
      limit: params.limit,
      offset: params.offset,
    });

    const filters = this.mapToReportFilters(params);

    return this.repository.getCertificates(filters, {
      limit: params.limit,
      offset: params.offset,
    });
  }

  /**
   * Converte os parâmetros de entrada para o formato do contrato
   * Transforma strings de data em objetos Date
   */
  private mapToReportFilters(params: GetReportCertificatesParams): ReportFilters {
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
