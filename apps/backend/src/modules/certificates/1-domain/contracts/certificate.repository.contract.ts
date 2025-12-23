import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { CertificateEntity } from '../entities/certificate.entity';

/**
 * DTO para criação de certidão no repositório
 */
export interface CreateCertificateData {
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes?: string;
  priority?: 'normal' | 'urgent';
}

/**
 * DTO para atualização de certidão no repositório
 */
export interface UpdateCertificateData {
  certificateType?: string;
  recordNumber?: string;
  partiesName?: string;
  notes?: string;
  priority?: 'normal' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'canceled';
  cost?: number;
  additionalCost?: number;
  orderNumber?: string;
  paymentDate?: Date;
}

/**
 * Opções para listagem de certidões
 */
export interface ListCertificatesOptions {
  userId?: string;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resultado paginado de certidões
 */
export interface PaginatedCertificates {
  data: CertificateEntity[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Contrato para repositório de certidões
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface CertificateRepositoryContract {
  /**
   * Cria uma nova certidão
   * @param data - Dados para criação
   * @returns Result com a entidade criada ou erro
   */
  create(data: CreateCertificateData): Promise<Result<CertificateEntity>>;

  /**
   * Busca certidão por ID
   * @param id - ID da certidão
   * @returns Result com a entidade ou erro se não encontrada
   */
  findById(id: string): Promise<Result<CertificateEntity>>;

  /**
   * Lista certidões com filtros opcionais
   * @param options - Opções de filtro e paginação
   * @returns Result com lista paginada de certidões
   */
  findAll(options: ListCertificatesOptions): Promise<Result<PaginatedCertificates>>;

  /**
   * Atualiza uma certidão existente
   * @param id - ID da certidão
   * @param data - Dados para atualização
   * @returns Result com a entidade atualizada ou erro
   */
  update(id: string, data: UpdateCertificateData): Promise<Result<CertificateEntity>>;

  /**
   * Remove uma certidão (soft delete ou hard delete)
   * @param id - ID da certidão
   * @returns Result<void> indicando sucesso ou erro
   */
  delete(id: string): Promise<Result<void>>;
}
