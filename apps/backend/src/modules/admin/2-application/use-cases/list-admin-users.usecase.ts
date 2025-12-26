import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  AdminUserRepositoryContract,
  ListAdminUsersParams,
  PaginatedAdminUsers,
} from '../../1-domain/contracts/admin-user.repository.contract';

/**
 * Caso de uso para listagem de usuários administrativos
 * Responsabilidade única: orquestrar a listagem de usuários
 */
export class ListAdminUsersUseCase {
  constructor(
    private readonly repository: AdminUserRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListAdminUsersParams): Promise<Result<PaginatedAdminUsers>> {
    this.logger.debug('Listando usuários admin', {
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
