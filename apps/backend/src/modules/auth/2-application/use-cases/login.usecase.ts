import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';
import { LoginRequestDto } from '../dto/login-request.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

/**
 * Use case de autenticação de usuário (login)
 * Responsável por orquestrar a lógica de autenticação
 * Segue o padrão da camada application: apenas orquestra, não implementa regras
 */
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa o caso de uso de login
   * @param request - Dados de requisição (email, password)
   * @returns Result com AuthResponseDto ou erro
   */
  async execute(request: LoginRequestDto): Promise<Result<AuthResponseDto>> {
    try {
      // Valida dados básicos
      if (!request.email || !request.password) {
        this.logger.warn('Login tentado com dados incompletos', {
          hasEmail: !!request.email,
          hasPassword: !!request.password,
        });

        return failure(AuthError.INVALID_CREDENTIALS);
      }

      // Tenta autenticar via repositório
      const authResult = await this.authRepository.login(
        request.email,
        request.password,
      );

      if (!authResult.success) {
        this.logger.warn('Login falhou - credenciais inválidas', {
          email: request.email,
          error: authResult.error,
        });

        return failure(AuthError.INVALID_CREDENTIALS);
      }

      // Autenticação bem-sucedida
      const authUser = authResult.data;

      this.logger.info('Login bem-sucedido', {
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role.getValue(),
      });

      // Retorna sucesso com dados do usuário e tokens
      return success(
        new AuthResponseDto(
          authUser,
          authUser.accessToken,
          authUser.refreshToken,
        ),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro durante login', {
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }
}
