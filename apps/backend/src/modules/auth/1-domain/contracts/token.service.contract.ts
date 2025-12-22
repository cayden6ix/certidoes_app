import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados decodificados de um token válido
 */
export interface TokenPayload {
  /**
   * ID do usuário
   */
  userId: string;

  /**
   * Role do usuário
   */
  role: string;

  /**
   * Email do usuário
   */
  email: string;
}

/**
 * Contrato para implementações de serviço de tokens
 * Define operações de validação e extração de tokens JWT
 * Implementações concretas devem usar Supabase Auth
 */
export interface TokenServiceContract {
  /**
   * Valida um token JWT e retorna seu payload decodificado
   * @param token - Token JWT a validar
   * @returns Result com TokenPayload ou erro
   */
  validateToken(token: string): Promise<Result<TokenPayload>>;

  /**
   * Extrai o token JWT do header Authorization
   * Espera formato: "Bearer <token>"
   * @param authHeader - Valor do header Authorization
   * @returns Result com token extraído ou erro
   */
  extractTokenFromHeader(authHeader: string): Result<string>;
}
