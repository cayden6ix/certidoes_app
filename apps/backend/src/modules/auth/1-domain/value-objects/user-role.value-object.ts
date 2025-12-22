import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';

/**
 * Tipos de roles disponíveis no sistema
 */
export type UserRole = 'client' | 'admin';

/**
 * Value Object que encapsula e valida o role de um usuário
 * Garante que apenas valores válidos sejam criados
 */
export class UserRoleValueObject {
  /**
   * Valor do role
   */
  private readonly value: UserRole;

  /**
   * Construtor privado para forçar uso da factory method
   */
  private constructor(role: UserRole) {
    this.value = role;
  }

  /**
   * Factory method que valida e cria uma instância
   * @param role - O valor do role a ser validado
   * @returns Result com a instância ou erro
   */
  static create(role: string): Result<UserRoleValueObject> {
    const validRoles: UserRole[] = ['client', 'admin'];

    if (!validRoles.includes(role as UserRole)) {
      return failure(
        `Role inválido: ${role}. Roles válidos: ${validRoles.join(', ')}`,
      );
    }

    return success(new UserRoleValueObject(role as UserRole));
  }

  /**
   * Retorna o valor do role
   */
  getValue(): UserRole {
    return this.value;
  }

  /**
   * Verifica se é role de administrador
   */
  isAdmin(): boolean {
    return this.value === 'admin';
  }

  /**
   * Verifica se é role de cliente
   */
  isClient(): boolean {
    return this.value === 'client';
  }

  /**
   * Compara com outro UserRoleValueObject
   */
  equals(other: UserRoleValueObject): boolean {
    return this.value === other.value;
  }

  /**
   * Representação em string
   */
  toString(): string {
    return this.value;
  }
}
