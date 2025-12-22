import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthServiceContract } from '../../1-domain/contracts/auth.service.contract';

/**
 * Caso de uso: Logout de usuário
 * Orquestra o processo de logout
 */
export class LogoutUserUseCase {
  constructor(
    private readonly authService: AuthServiceContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(accessToken: string, userId: string): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Iniciando logout de usuário', {
        context: 'LogoutUserUseCase',
        userId,
      });

      // Realizar logout no Supabase
      await this.authService.signOut(accessToken);

      const duration = Date.now() - startTime;

      this.logger.info('Logout realizado com sucesso', {
        context: 'LogoutUserUseCase',
        userId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Erro ao realizar logout', {
        context: 'LogoutUserUseCase',
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration,
      });

      throw error;
    }
  }
}
