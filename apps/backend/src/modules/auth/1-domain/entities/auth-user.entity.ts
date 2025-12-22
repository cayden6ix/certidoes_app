/**
 * Entidade de domínio para usuário autenticado
 * Representa o usuário no contexto de autenticação
 */
export class AuthUserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: 'client' | 'admin',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Verifica se o usuário é cliente
   */
  isClient(): boolean {
    return this.role === 'client';
  }

  /**
   * Cria uma cópia da entidade (imutabilidade)
   */
  clone(): AuthUserEntity {
    return new AuthUserEntity(
      this.id,
      this.email,
      this.fullName,
      this.role,
      this.createdAt,
      this.updatedAt,
    );
  }
}
