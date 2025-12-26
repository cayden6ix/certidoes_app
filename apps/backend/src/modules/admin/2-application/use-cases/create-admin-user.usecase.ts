import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  AdminUserRepositoryContract,
  AdminUserData,
  CreateAdminUserParams,
} from '../../1-domain/contracts/admin-user.repository.contract';

/**
 * Caso de uso para criação de usuário administrativo
 * Responsabilidade única: orquestrar a criação de usuário
 */
export class CreateAdminUserUseCase {
  constructor(
    private readonly repository: AdminUserRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreateAdminUserParams): Promise<Result<AdminUserData>> {
    this.logger.info('Criando usuário admin', {
      email: params.email,
      role: params.role,
    });

    const result = await this.repository.create(params);

    if (result.success) {
      this.logger.info('Usuário admin criado com sucesso', {
        userId: result.data.id,
        email: result.data.email,
      });
    }

    return result;
  }
}
