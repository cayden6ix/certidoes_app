import type { Request } from 'express';

/**
 * Informações do usuário autenticado
 * Anexadas ao request após validação pelo JwtAuthGuard
 */
export interface AuthenticatedUser {
  /**
   * ID do usuário (UUID)
   */
  userId: string;

  /**
   * Role do usuário (client ou admin)
   */
  role: 'client' | 'admin';

  /**
   * Email do usuário
   */
  email: string;
}

/**
 * Request com usuário autenticado
 * Estende Express Request para adicionar propriedade user
 */
export interface AuthenticatedRequest extends Request {
  /**
   * Dados do usuário autenticado, preenchidos por JwtAuthGuard
   */
  user: AuthenticatedUser;
}
