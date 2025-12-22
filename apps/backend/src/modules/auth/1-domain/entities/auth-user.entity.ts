import type { UserRoleValueObject } from '../value-objects/user-role.value-object';

/**
 * Entidade que representa um usuário autenticado
 * Encapsula dados imutáveis do usuário no sistema
 */
export class AuthUserEntity {
  /**
   * ID único do usuário (UUID do auth.users do Supabase)
   */
  readonly id: string;

  /**
   * Email do usuário
   */
  readonly email: string;

  /**
   * Nome completo do usuário
   */
  readonly fullName: string;

  /**
   * Role do usuário (client ou admin)
   */
  readonly role: UserRoleValueObject;

  /**
   * Data de criação do usuário
   */
  readonly createdAt: Date;

  /**
   * Construtor privado para garantir criação via factory method
   */
  private constructor(
    id: string,
    email: string,
    fullName: string,
    role: UserRoleValueObject,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.createdAt = createdAt;
  }

  /**
   * Factory method para criar instância de AuthUserEntity
   * @param data - Dados do usuário
   * @returns Instância de AuthUserEntity
   */
  static create(data: {
    id: string;
    email: string;
    fullName: string;
    role: UserRoleValueObject;
    createdAt: Date;
  }): AuthUserEntity {
    return new AuthUserEntity(
      data.id,
      data.email,
      data.fullName,
      data.role,
      data.createdAt,
    );
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.role.isAdmin();
  }

  /**
   * Verifica se o usuário é cliente
   */
  isClient(): boolean {
    return this.role.isClient();
  }

  /**
   * Converte a entidade em objeto plano (DTO)
   */
  toDTO() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role.getValue(),
      createdAt: this.createdAt,
    };
  }
}
