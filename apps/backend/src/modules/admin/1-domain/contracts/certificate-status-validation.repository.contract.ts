import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de uma regra de validação por status de certidão
 */
export interface CertificateStatusValidationData {
  id: string;
  statusId: string;
  statusName: string;
  validationId: string;
  validationName: string;
  validationDescription: string | null;
  requiredField: string | null;
  confirmationText: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parâmetros para listagem de validações por status
 */
export interface ListStatusValidationsParams {
  statusId?: string;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de validações por status
 */
export interface PaginatedStatusValidations {
  data: CertificateStatusValidationData[];
  total: number;
}

/**
 * Parâmetros para criação de validação por status
 */
export interface CreateStatusValidationParams {
  statusId: string;
  validationId: string;
  requiredField?: string | null;
  confirmationText?: string | null;
}

/**
 * Parâmetros para atualização de validação por status
 */
export interface UpdateStatusValidationParams {
  statusId?: string;
  validationId?: string;
  requiredField?: string | null;
  confirmationText?: string | null;
}

/**
 * Token de injeção de dependência para o repositório de validações por status
 */
export const CERTIFICATE_STATUS_VALIDATION_REPOSITORY = Symbol(
  'CERTIFICATE_STATUS_VALIDATION_REPOSITORY',
);

/**
 * Contrato para repositório de validações por status de certidão
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface CertificateStatusValidationRepositoryContract {
  /**
   * Lista validações por status com paginação
   */
  list(params: ListStatusValidationsParams): Promise<Result<PaginatedStatusValidations>>;

  /**
   * Verifica se já existe um vínculo de validação com os mesmos parâmetros
   */
  existsBinding(
    statusId: string,
    validationId: string,
    requiredField: string | null,
  ): Promise<Result<boolean>>;

  /**
   * Cria uma nova validação por status
   */
  create(params: CreateStatusValidationParams): Promise<Result<CertificateStatusValidationData>>;

  /**
   * Atualiza uma validação por status existente
   */
  update(
    id: string,
    params: UpdateStatusValidationParams,
  ): Promise<Result<CertificateStatusValidationData>>;

  /**
   * Remove uma validação por status
   */
  remove(id: string): Promise<Result<void>>;
}
