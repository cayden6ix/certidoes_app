import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateCommentRepositoryContract } from '../../../1-domain/contracts/certificate-comment.repository.contract';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import type { DeleteCommentRequestDto } from '../../dto/comment-request.dto';

/**
 * Use case para deletar comentário de uma certidão
 * Apenas admins podem deletar comentários (para moderação)
 */
export class DeleteCommentUseCase {
  constructor(
    private readonly commentRepository: CertificateCommentRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(request: DeleteCommentRequestDto): Promise<Result<void>> {
    this.logger.debug('Deletando comentário de certidão', {
      commentId: request.commentId,
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Apenas admins podem deletar comentários
    if (request.userRole !== 'admin') {
      this.logger.warn('Usuário não-admin tentando deletar comentário', {
        commentId: request.commentId,
        userId: request.userId,
        userRole: request.userRole,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    // Verifica se o comentário existe
    const commentResult = await this.commentRepository.findById(request.commentId);
    if (!commentResult.success) {
      return failure(commentResult.error);
    }

    if (!commentResult.data) {
      this.logger.warn('Comentário não encontrado para deleção', {
        commentId: request.commentId,
      });
      return failure('Comentário não encontrado');
    }

    // Verifica se o comentário pertence ao certificado informado
    if (commentResult.data.certificateId !== request.certificateId) {
      this.logger.warn('Comentário não pertence ao certificado informado', {
        commentId: request.commentId,
        expectedCertificateId: request.certificateId,
        actualCertificateId: commentResult.data.certificateId,
      });
      return failure('Comentário não pertence a este certificado');
    }

    // Deleta o comentário
    const deleteResult = await this.commentRepository.delete(request.commentId);

    if (!deleteResult.success) {
      return failure(deleteResult.error);
    }

    this.logger.info('Comentário deletado com sucesso', {
      commentId: request.commentId,
      certificateId: request.certificateId,
      deletedBy: request.userId,
    });

    return success(undefined);
  }
}
