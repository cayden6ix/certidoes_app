import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusRepositoryContract,
  ListCertificateStatusParams,
  PaginatedCertificateStatus,
} from '../../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Caso de uso para listagem de status de certidão
 * Responsabilidade única: orquestrar a listagem de status de certidão
 */
export class ListCertificateStatusUseCase {
  constructor(
    private readonly repository: CertificateStatusRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListCertificateStatusParams): Promise<Result<PaginatedCertificateStatus>> {
    this.logger.debug('Listando status de certidão', {
      search: params.search,
      includeInactive: params.includeInactive,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
