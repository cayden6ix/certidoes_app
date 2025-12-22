import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AUTH_TOKENS } from '../../4-infrastructure/di/auth.tokens';

/**
 * Decorator para especificar roles permitidas em uma rota
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Guard para proteger rotas baseado em roles
 * Deve ser usado em conjunto com JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_TOKENS.LOGGER)
    private readonly logger: LoggerContract,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      // Se não há roles especificadas, permite acesso
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user || !user.role) {
      this.logger.warn('Tentativa de acesso sem usuário autenticado', {
        context: 'RolesGuard',
        path: request.path,
        method: request.method,
        requiredRoles,
      });
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn('Tentativa de acesso sem permissão', {
        context: 'RolesGuard',
        path: request.path,
        method: request.method,
        userId: user.userId,
        userRole: user.role,
        requiredRoles,
      });
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    return true;
  }
}
