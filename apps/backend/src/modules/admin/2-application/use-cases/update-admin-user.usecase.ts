import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  AdminUserRepositoryContract,
  AdminUserData,
  UpdateAdminUserParams,
} from '../../1-domain/contracts/admin-user.repository.contract';

/**
 * Caso de uso para atualização de usuário administrativo
 * Responsabilidade única: orquestrar a atualização de usuário
 */
export class UpdateAdminUserUseCase {
  constructor(
    private readonly repository: AdminUserRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string, params: UpdateAdminUserParams): Promise<Result<AdminUserData>> {
    this.logger.info('Atualizando usuário admin', { userId: id });

    const result = await this.repository.update(id, params);

    if (result.success) {
      this.logger.info('Usuário admin atualizado com sucesso', {
        userId: result.data.id,
      });
    }

    return result;
  }
}
