import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  ValidationRepositoryContract,
  ListValidationsParams,
  PaginatedValidations,
} from '../../../1-domain/contracts/validation.repository.contract';

/**
 * Caso de uso para listagem de validações
 * Responsabilidade única: orquestrar a listagem de validações
 */
export class ListValidationsUseCase {
  constructor(
    private readonly repository: ValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListValidationsParams): Promise<Result<PaginatedValidations>> {
    this.logger.debug('Listando validações', {
      search: params.search,
      includeInactive: params.includeInactive,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
