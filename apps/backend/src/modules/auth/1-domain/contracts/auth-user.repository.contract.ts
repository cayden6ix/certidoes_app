import { AuthUserEntity } from '../entities/auth-user.entity';

/**
 * Contrato para repositório de usuários autenticados
 * Define operações de persistência no domínio
 */
export interface AuthUserRepositoryContract {
  /**
   * Busca usuário por ID
   */
  findById(id: string): Promise<AuthUserEntity | null>;

  /**
   * Busca usuário por email
   */
  findByEmail(email: string): Promise<AuthUserEntity | null>;

  /**
   * Cria um novo usuário
   */
  create(user: AuthUserEntity): Promise<AuthUserEntity>;

  /**
   * Atualiza usuário existente
   */
  update(user: AuthUserEntity): Promise<AuthUserEntity>;
}
