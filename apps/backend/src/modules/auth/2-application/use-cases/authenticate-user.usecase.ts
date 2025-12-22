import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthServiceContract } from '../../1-domain/contracts/auth.service.contract';
import { AuthUserRepositoryContract } from '../../1-domain/contracts/auth-user.repository.contract';
import { EmailValueObject } from '../../1-domain/value-objects/email.value-object';
import { AuthenticationRequestDto } from '../dto/authentication-request.dto';
import { AuthenticationResponseDto } from '../dto/authentication-response.dto';

/**
 * Caso de uso: Autenticar usuário
 * Orquestra o processo de autenticação
 */
export class AuthenticateUserUseCase {
  constructor(
    private readonly authService: AuthServiceContract,
    private readonly userRepository: AuthUserRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(dto: AuthenticationRequestDto): Promise<AuthenticationResponseDto> {
    const startTime = Date.now();

    try {
      // Validar email
      const email = new EmailValueObject(dto.email);

      this.logger.info('Iniciando autenticação de usuário', {
        context: 'AuthenticateUserUseCase',
        email: email.mask(),
      });

      // Autenticar com Supabase
      const authResult = await this.authService.signInWithPassword(
        email.getValue(),
        dto.password,
      );

      // Buscar ou criar perfil do usuário
      let user = await this.userRepository.findById(authResult.user.id);

      if (!user) {
        this.logger.warn('Usuário autenticado mas perfil não encontrado, buscando por email', {
          context: 'AuthenticateUserUseCase',
          userId: authResult.user.id,
          email: email.mask(),
        });

        user = await this.userRepository.findByEmail(authResult.user.email);
      }

      if (!user) {
        this.logger.error('Usuário autenticado mas perfil não existe no banco', {
          context: 'AuthenticateUserUseCase',
          userId: authResult.user.id,
          email: email.mask(),
        });
        throw new Error('Perfil de usuário não encontrado');
      }

      const duration = Date.now() - startTime;

      this.logger.info('Autenticação realizada com sucesso', {
        context: 'AuthenticateUserUseCase',
        userId: user.id,
        email: email.mask(),
        role: user.role,
        duration,
      });

      return new AuthenticationResponseDto(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        authResult.session,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Erro ao autenticar usuário', {
        context: 'AuthenticateUserUseCase',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration,
      });

      throw error;
    }
  }
}
