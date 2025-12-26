import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de uma validação
 */
export interface ValidationData {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Parâmetros para listagem de validações
 */
export interface ListValidationsParams {
  search?: string;
  includeInactive?: boolean;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de validações
 */
export interface PaginatedValidations {
  data: ValidationData[];
  total: number;
}

/**
 * Parâmetros para criação de validação
 */
export interface CreateValidationParams {
  name: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Parâmetros para atualização de validação
 */
export interface UpdateValidationParams {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Token de injeção de dependência para o repositório de validações
 */
export const VALIDATION_REPOSITORY = Symbol('VALIDATION_REPOSITORY');

/**
 * Contrato para repositório de validações
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface ValidationRepositoryContract {
  /**
   * Lista validações com paginação e busca opcional
   */
  list(params: ListValidationsParams): Promise<Result<PaginatedValidations>>;

  /**
   * Busca uma validação por nome
   */
  findByName(name: string): Promise<Result<ValidationData | null>>;

  /**
   * Cria uma nova validação
   */
  create(params: CreateValidationParams): Promise<Result<ValidationData>>;

  /**
   * Atualiza uma validação existente
   */
  update(id: string, params: UpdateValidationParams): Promise<Result<ValidationData>>;

  /**
   * Remove uma validação
   */
  remove(id: string): Promise<Result<void>>;
}
