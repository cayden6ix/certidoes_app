import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateCommentRepositoryContract,
  CreateCertificateCommentData,
} from '../../1-domain/contracts/certificate-comment.repository.contract';
import { CertificateCommentEntity } from '../../1-domain/entities/certificate-comment.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

interface CertificateCommentRow {
  id: string;
  certificate_id: string;
  user_id: string;
  user_role: 'client' | 'admin';
  user_name: string;
  content: string;
  created_at: string;
}

/**
 * Repositório de comentários de certidões com Supabase
 */
export class SupabaseCertificateCommentRepository implements CertificateCommentRepositoryContract {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.logger.debug('Repositório de comentários de certidões Supabase inicializado');
  }

  async create(data: CreateCertificateCommentData): Promise<Result<CertificateCommentEntity>> {
    try {
      const { data: insertedData, error } = await this.supabaseClient
        .from('certificate_comments')
        .insert({
          certificate_id: data.certificateId,
          user_id: data.userId,
          user_role: data.userRole,
          user_name: data.userName,
          content: data.content,
        })
        .select()
        .single<CertificateCommentRow>();

      if (error || !insertedData) {
        this.logger.error('Erro ao criar comentário de certidão', {
          error: error?.message,
          certificateId: data.certificateId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(this.mapToEntity(insertedData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar comentário de certidão', {
        error: errorMessage,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  async listByCertificateId(certificateId: string): Promise<Result<CertificateCommentEntity[]>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('certificate_comments')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error('Erro ao listar comentários de certidão', {
          error: error.message,
          certificateId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const comments = (data as CertificateCommentRow[]).map((row) => this.mapToEntity(row));

      return success(comments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar comentários de certidão', {
        error: errorMessage,
        certificateId,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  async findById(id: string): Promise<Result<CertificateCommentEntity | null>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('certificate_comments')
        .select('*')
        .eq('id', id)
        .single<CertificateCommentRow>();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        this.logger.error('Erro ao buscar comentário de certidão', {
          error: error.message,
          commentId: id,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(this.mapToEntity(data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar comentário de certidão', {
        error: errorMessage,
        commentId: id,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient
        .from('certificate_comments')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error('Erro ao deletar comentário de certidão', {
          error: error.message,
          commentId: id,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao deletar comentário de certidão', {
        error: errorMessage,
        commentId: id,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: CertificateCommentRow): CertificateCommentEntity {
    return CertificateCommentEntity.create({
      id: row.id,
      certificateId: row.certificate_id,
      userId: row.user_id,
      userRole: row.user_role,
      userName: row.user_name,
      content: row.content,
      createdAt: new Date(row.created_at),
    });
  }
}
