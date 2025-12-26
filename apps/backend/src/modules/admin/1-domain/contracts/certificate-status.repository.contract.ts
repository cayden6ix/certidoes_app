import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de um status de certidão
 */
export interface CertificateStatusData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  displayOrder: number;
  isActive: boolean;
  canEditCertificate: boolean;
  isFinal: boolean;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Parâmetros para listagem de status de certidão
 */
export interface ListCertificateStatusParams {
  search?: string;
  includeInactive?: boolean;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de status de certidão
 */
export interface PaginatedCertificateStatus {
  data: CertificateStatusData[];
  total: number;
}

/**
 * Parâmetros para criação de status de certidão
 */
export interface CreateCertificateStatusParams {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

/**
 * Parâmetros para atualização de status de certidão
 */
export interface UpdateCertificateStatusParams {
  displayName?: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

/**
 * Token de injeção de dependência para o repositório de status de certidão
 */
export const CERTIFICATE_STATUS_REPOSITORY = Symbol('CERTIFICATE_STATUS_REPOSITORY');

/**
 * Contrato para repositório de status de certidão
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface CertificateStatusRepositoryContract {
  /**
   * Lista status de certidão com paginação e busca opcional
   */
  list(params: ListCertificateStatusParams): Promise<Result<PaginatedCertificateStatus>>;

  /**
   * Busca um status por ID
   */
  findById(id: string): Promise<Result<CertificateStatusData | null>>;

  /**
   * Busca um status pelo nome
   */
  findByName(name: string): Promise<Result<CertificateStatusData | null>>;

  /**
   * Conta quantas certidões usam um determinado status
   */
  countCertificatesUsingStatus(statusId: string): Promise<Result<number>>;

  /**
   * Cria um novo status de certidão
   */
  create(params: CreateCertificateStatusParams): Promise<Result<CertificateStatusData>>;

  /**
   * Atualiza um status de certidão existente
   */
  update(id: string, params: UpdateCertificateStatusParams): Promise<Result<CertificateStatusData>>;

  /**
   * Remove um status de certidão
   */
  remove(id: string): Promise<Result<void>>;
}
