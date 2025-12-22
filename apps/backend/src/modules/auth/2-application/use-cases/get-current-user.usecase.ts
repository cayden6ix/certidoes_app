import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';
import type { AuthUserEntity } from '../../1-domain/entities/auth-user.entity';

/**
 * Use case para obter dados do usuário autenticado
 * Valida o token e retorna informações do perfil completo
 */
export class GetCurrentUserUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa o caso de uso de obter usuário atual
   * @param token - Token JWT do usuário
   * @returns Result com AuthUserEntity ou erro
   */
  async execute(token: string): Promise<Result<AuthUserEntity>> {
    try {
      if (!token) {
        this.logger.warn('Tentativa de obter usuário sem token');
        return failure(AuthError.TOKEN_MISSING);
      }

      // Obtém usuário do repositório
      const userResult = await this.authRepository.getCurrentUser(token);

      if (!userResult.success) {
        this.logger.warn('Falha ao obter usuário atual', {
          error: userResult.error,
        });

        return userResult;
      }

      this.logger.debug('Usuário atual obtido com sucesso', {
        userId: userResult.data.id,
        role: userResult.data.role.getValue(),
      });

      return userResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao obter usuário atual', {
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }
}
