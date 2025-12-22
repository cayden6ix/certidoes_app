import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../types/express-request.types';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';

/**
 * Guard para verificação de roles
 * Verifica se o usuário tem permissão para acessar o recurso
 * IMPORTANTE: Depende do JwtAuthGuard ter sido executado primeiro
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Implementação do método CanActivate
   */
  canActivate(context: ExecutionContext): boolean {
    // Lê metadata de roles definida pelo decorator @Roles()
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // Se não há roles definidas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Valida presença do usuário (JwtAuthGuard deve ter preenchido isso)
    if (!user) {
      this.logger.error('RolesGuard acionado sem usuário autenticado', {
        path: request.path,
        method: request.method,
      });

      throw new ForbiddenException(AuthError.UNAUTHORIZED);
    }

    // Verifica se o role do usuário está na lista de roles permitidos
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      this.logger.warn('Acesso negado - role insuficiente', {
        userId: user.userId,
        userRole: user.role,
        requiredRoles,
        path: request.path,
        method: request.method,
      });

      throw new ForbiddenException(AuthError.INSUFFICIENT_PERMISSIONS);
    }

    this.logger.debug('Acesso autorizado por role', {
      userId: user.userId,
      role: user.role,
      requiredRoles,
      path: request.path,
    });

    return true;
  }
}
