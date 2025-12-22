import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para definir roles permitidas em um handler
 * Deve ser usado com RolesGuard
 * Uso: @Roles('admin', 'client') @Get()
 *
 * @param roles - Array de roles permitidas
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
