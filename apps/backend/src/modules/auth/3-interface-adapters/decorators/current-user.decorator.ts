import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/express-request.types';
import type { AuthenticatedRequest } from '../types/express-request.types';

/**
 * Decorator para injetar dados do usuário autenticado no handler
 * Extrai a propriedade `user` do request
 * Uso: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
