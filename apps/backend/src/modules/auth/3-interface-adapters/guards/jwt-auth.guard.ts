import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthServiceContract } from '../../1-domain/contracts/auth.service.contract';
import { AUTH_TOKENS } from '../../4-infrastructure/di/auth.tokens';

/**
 * Guard para proteger rotas que requerem autenticação JWT
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKENS.AUTH_SERVICE)
    private readonly authService: AuthServiceContract,
    @Inject(AUTH_TOKENS.LOGGER)
    private readonly logger: LoggerContract,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('Token não fornecido na requisição', {
        context: 'JwtAuthGuard',
        path: request.path,
        method: request.method,
      });
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.authService.verifyToken(token);

      // Adiciona informações do usuário na requisição
      (request as any).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      this.logger.warn('Token inválido ou expirado', {
        context: 'JwtAuthGuard',
        path: request.path,
        method: request.method,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
