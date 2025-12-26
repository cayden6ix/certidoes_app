import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTagRepositoryContract,
  ListTagsParams,
  PaginatedTags,
} from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para listagem de tags de certidão
 * Responsabilidade única: orquestrar a listagem de tags com paginação
 */
export class ListTagsUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListTagsParams): Promise<Result<PaginatedTags>> {
    this.logger.debug('Listando tags de certidão', {
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
