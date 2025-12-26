import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusValidationRepositoryContract,
  ListStatusValidationsParams,
  PaginatedStatusValidations,
} from '../../../1-domain/contracts/certificate-status-validation.repository.contract';

/**
 * Caso de uso para listagem de validações por status
 * Responsabilidade única: orquestrar a listagem de validações por status
 */
export class ListStatusValidationsUseCase {
  constructor(
    private readonly repository: CertificateStatusValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListStatusValidationsParams): Promise<Result<PaginatedStatusValidations>> {
    this.logger.debug('Listando validações por status', {
      statusId: params.statusId,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
