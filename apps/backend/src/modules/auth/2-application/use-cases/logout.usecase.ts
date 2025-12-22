import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';

/**
 * Use case de logout de usuário
 * Para JWT stateless, apenas registra auditoria
 * O token é invalidado no frontend ao ser removido
 */
export class LogoutUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa o caso de uso de logout
   * @param token - Token JWT do usuário
   * @returns Result<void> ou erro
   */
  async execute(token: string): Promise<Result<void>> {
    try {
      // Chama repositório para fazer logout
      // Em JWT stateless, o repositório apenas registra auditoria
      const logoutResult = await this.authRepository.logout(token);

      if (!logoutResult.success) {
        return logoutResult;
      }

      this.logger.info('Logout registrado com sucesso');

      return success(undefined as never);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro durante logout', {
        error: errorMessage,
      });

      return success(undefined as never); // Logout sempre retorna sucesso
    }
  }
}
