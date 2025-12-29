import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { CertificateCommentEntity } from '../entities/certificate-comment.entity';

/**
 * DTO para criação de comentário de certidão no repositório
 */
export interface CreateCertificateCommentData {
  certificateId: string;
  userId: string;
  userRole: 'client' | 'admin';
  userName: string;
  content: string;
}

/**
 * Contrato para repositório de comentários de certidões
 */
export interface CertificateCommentRepositoryContract {
  /**
   * Cria um novo comentário
   */
  create(data: CreateCertificateCommentData): Promise<Result<CertificateCommentEntity>>;

  /**
   * Lista comentários de uma certidão ordenados por data de criação (mais antigo primeiro)
   */
  listByCertificateId(certificateId: string): Promise<Result<CertificateCommentEntity[]>>;

  /**
   * Busca um comentário pelo ID
   */
  findById(id: string): Promise<Result<CertificateCommentEntity | null>>;

  /**
   * Deleta um comentário pelo ID
   */
  delete(id: string): Promise<Result<void>>;
}
