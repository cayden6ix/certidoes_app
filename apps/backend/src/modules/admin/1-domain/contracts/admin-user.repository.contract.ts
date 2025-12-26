import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de um usuário administrativo
 */
export interface AdminUserData {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'client';
  createdAt: string;
  updatedAt: string;
}

/**
 * Parâmetros para listagem de usuários
 */
export interface ListAdminUsersParams {
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de usuários
 */
export interface PaginatedAdminUsers {
  data: AdminUserData[];
  total: number;
}

/**
 * Parâmetros para criação de usuário
 */
export interface CreateAdminUserParams {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'client';
}

/**
 * Parâmetros para atualização de usuário
 */
export interface UpdateAdminUserParams {
  email?: string;
  fullName?: string;
  role?: 'admin' | 'client';
  password?: string;
}

/**
 * Token de injeção de dependência para o repositório de usuários admin
 */
export const ADMIN_USER_REPOSITORY = Symbol('ADMIN_USER_REPOSITORY');

/**
 * Contrato para repositório de usuários administrativos
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface AdminUserRepositoryContract {
  /**
   * Lista usuários com paginação e busca opcional
   */
  list(params: ListAdminUsersParams): Promise<Result<PaginatedAdminUsers>>;

  /**
   * Busca um usuário por ID
   */
  findById(id: string): Promise<Result<AdminUserData>>;

  /**
   * Cria um novo usuário
   */
  create(params: CreateAdminUserParams): Promise<Result<AdminUserData>>;

  /**
   * Atualiza um usuário existente
   */
  update(id: string, params: UpdateAdminUserParams): Promise<Result<AdminUserData>>;

  /**
   * Remove um usuário
   */
  remove(id: string): Promise<Result<void>>;
}
