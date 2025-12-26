import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de um tipo de certidão
 */
export interface CertificateTypeData {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Parâmetros para listagem de tipos de certidão
 */
export interface ListCertificateTypesParams {
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de tipos de certidão
 */
export interface PaginatedCertificateTypes {
  data: CertificateTypeData[];
  total: number;
}

/**
 * Parâmetros para criação de tipo de certidão
 */
export interface CreateCertificateTypeParams {
  name: string;
}

/**
 * Parâmetros para atualização de tipo de certidão
 */
export interface UpdateCertificateTypeParams {
  name?: string;
}

/**
 * Token de injeção de dependência para o repositório de tipos de certidão
 */
export const CERTIFICATE_TYPE_REPOSITORY = Symbol('CERTIFICATE_TYPE_REPOSITORY');

/**
 * Contrato para repositório de tipos de certidão
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface CertificateTypeRepositoryContract {
  /**
   * Lista tipos de certidão com paginação e busca opcional
   */
  list(params: ListCertificateTypesParams): Promise<Result<PaginatedCertificateTypes>>;

  /**
   * Cria um novo tipo de certidão
   */
  create(params: CreateCertificateTypeParams): Promise<Result<CertificateTypeData>>;

  /**
   * Atualiza um tipo de certidão existente
   */
  update(id: string, params: UpdateCertificateTypeParams): Promise<Result<CertificateTypeData>>;

  /**
   * Remove um tipo de certidão
   */
  remove(id: string): Promise<Result<void>>;
}
