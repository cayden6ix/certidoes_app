import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de uma tag de certidão
 */
export interface CertificateTagData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Parâmetros para listagem de tags
 */
export interface ListTagsParams {
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de tags
 */
export interface PaginatedTags {
  data: CertificateTagData[];
  total: number;
}

/**
 * Parâmetros para criação de tag
 */
export interface CreateTagParams {
  name: string;
  color?: string | null;
}

/**
 * Parâmetros para atualização de tag
 */
export interface UpdateTagParams {
  name?: string;
  color?: string | null;
}

/**
 * Parâmetros para atualização das tags de um certificado
 */
export interface UpdateCertificateTagsParams {
  certificateId: string;
  tagIds: string[];
  actorUserId?: string;
}

/**
 * Token de injeção de dependência para o repositório de tags
 */
export const CERTIFICATE_TAG_REPOSITORY = Symbol('CERTIFICATE_TAG_REPOSITORY');

/**
 * Contrato do repositório de tags de certidão
 * Define as operações disponíveis para gerenciamento de tags
 */
export interface CertificateTagRepositoryContract {
  /**
   * Lista tags com paginação e busca opcional
   */
  list(params: ListTagsParams): Promise<Result<PaginatedTags>>;

  /**
   * Cria uma nova tag
   */
  create(params: CreateTagParams): Promise<Result<CertificateTagData>>;

  /**
   * Atualiza uma tag existente
   */
  update(id: string, params: UpdateTagParams): Promise<Result<CertificateTagData>>;

  /**
   * Remove uma tag e seus vínculos com certificados
   */
  remove(id: string): Promise<Result<void>>;

  /**
   * Associa uma tag a um certificado
   */
  assignTagToCertificate(certificateId: string, tagId: string): Promise<Result<void>>;

  /**
   * Remove a associação de uma tag de um certificado
   */
  unassignTagFromCertificate(certificateId: string, tagId: string): Promise<Result<void>>;

  /**
   * Atualiza todas as tags de um certificado (substitui as existentes)
   * Retorna as tags anteriores e novas para auditoria
   */
  updateCertificateTags(
    certificateId: string,
    tagIds: string[],
  ): Promise<Result<{ previousTags: string[]; newTags: string[] }>>;

  /**
   * Busca os nomes das tags pelos IDs
   */
  getTagNamesByIds(tagIds: string[]): Promise<Result<string[]>>;
}
