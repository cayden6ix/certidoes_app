import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { TOKEN_SERVICE_CONTRACT } from '../../4-infrastructure/di/auth.tokens';
import type { TokenServiceContract } from '../../1-domain/contracts/token.service.contract';
import type { AuthenticatedRequest } from '../types/express-request.types';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';

/**
 * Guard para validação de JWT do Supabase
 * Valida token e anexa informações do usuário no request
 * IMPORTANTE: Deve ser executado ANTES do RolesGuard
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE_CONTRACT)
    private readonly tokenService: TokenServiceContract,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Implementação do método CanActivate
   * Valida token e permite ou nega acesso
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    // Valida presença do header
    if (!authHeader) {
      this.logger.warn('Acesso sem token de autenticação', {
        path: request.path,
        method: request.method,
        ip: request.ip,
      });

      throw new UnauthorizedException(AuthError.TOKEN_MISSING);
    }

    // Extrai token do header
    const tokenResult = this.tokenService.extractTokenFromHeader(authHeader);

    if (!tokenResult.success) {
      this.logger.warn('Formato de token inválido', {
        path: request.path,
        method: request.method,
      });

      throw new UnauthorizedException(tokenResult.error);
    }

    const token = tokenResult.data;

    // Valida token
    const validationResult = await this.tokenService.validateToken(token);

    if (!validationResult.success) {
      this.logger.warn('Token inválido ou expirado', {
        path: request.path,
        method: request.method,
        error: validationResult.error,
      });

      throw new UnauthorizedException(validationResult.error);
    }

    // Anexa informações do usuário no request
    const tokenPayload = validationResult.data;
    request.user = {
      userId: tokenPayload.userId,
      role: tokenPayload.role,
      email: tokenPayload.email,
    };

    this.logger.debug('Acesso autorizado', {
      userId: request.user.userId,
      role: request.user.role,
      path: request.path,
      method: request.method,
    });

    return true;
  }
}
