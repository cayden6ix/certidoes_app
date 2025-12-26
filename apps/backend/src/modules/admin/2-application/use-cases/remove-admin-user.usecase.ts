import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { AdminUserRepositoryContract } from '../../1-domain/contracts/admin-user.repository.contract';

/**
 * Caso de uso para remoção de usuário administrativo
 * Responsabilidade única: orquestrar a remoção de usuário
 */
export class RemoveAdminUserUseCase {
  constructor(
    private readonly repository: AdminUserRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.info('Removendo usuário admin', { userId: id });

    const result = await this.repository.remove(id);

    if (result.success) {
      this.logger.info('Usuário admin removido com sucesso', { userId: id });
    }

    return result;
  }
}
