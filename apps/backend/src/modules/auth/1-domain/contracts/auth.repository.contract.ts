import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { AuthUserEntity } from '../entities/auth-user.entity';

/**
 * Contrato para implementações de repositório de autenticação
 * Define as operações de autenticação que devem ser suportadas
 * Implementações concretas devem usar Supabase Auth
 */
export interface AuthRepositoryContract {
  /**
   * Autentica um usuário com email e senha
   * @param email - Email do usuário
   * @param password - Senha em texto plano
   * @returns Result com AuthUserEntity ou erro
   */
  login(email: string, password: string): Promise<Result<AuthUserEntity>>;

  /**
   * Faz logout do usuário
   * Para JWT stateless, apenas registra auditoria
   * @param token - Token JWT do usuário
   * @returns Result<void> ou erro
   */
  logout(token: string): Promise<Result<void>>;

  /**
   * Busca usuário autenticado pelo token JWT
   * @param token - Token JWT do usuário
   * @returns Result com AuthUserEntity ou erro
   */
  getCurrentUser(token: string): Promise<Result<AuthUserEntity>>;
}
