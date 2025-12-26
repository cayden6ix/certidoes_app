import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTypeRepositoryContract,
  ListCertificateTypesParams,
  PaginatedCertificateTypes,
} from '../../../1-domain/contracts/certificate-type.repository.contract';

/**
 * Caso de uso para listagem de tipos de certidão
 * Responsabilidade única: orquestrar a listagem de tipos de certidão
 */
export class ListCertificateTypesUseCase {
  constructor(
    private readonly repository: CertificateTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListCertificateTypesParams): Promise<Result<PaginatedCertificateTypes>> {
    this.logger.debug('Listando tipos de certidão', {
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
