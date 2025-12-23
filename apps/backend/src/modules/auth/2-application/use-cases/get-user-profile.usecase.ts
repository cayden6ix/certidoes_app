import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';
import type { AuthUserEntity } from '../../1-domain/entities/auth-user.entity';

/**
 * Use case para obter perfil de usuário pelo ID
 */
export class GetUserProfileUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa o caso de uso de obter perfil pelo ID
   * @param userId - ID do usuário
   * @returns Result com AuthUserEntity ou erro
   */
  async execute(userId: string): Promise<Result<AuthUserEntity>> {
    try {
      if (!userId) {
        this.logger.warn('Tentativa de obter perfil sem ID');
        return failure(AuthError.USER_NOT_FOUND);
      }

      const result = await this.authRepository.getUserById(userId);

      if (!result.success) {
        this.logger.warn('Falha ao obter perfil', {
          userId,
          error: result.error,
        });

        return result;
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao obter perfil de usuário', {
        userId,
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }
}
