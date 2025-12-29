import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../../1-domain/contracts/certificate.repository.contract';
import type { CertificateCommentRepositoryContract } from '../../../1-domain/contracts/certificate-comment.repository.contract';
import type { CertificateCommentEntity } from '../../../1-domain/entities/certificate-comment.entity';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import type { CreateCommentRequestDto } from '../../dto/comment-request.dto';

/**
 * Use case para criar comentário em uma certidão
 * Valida acesso do usuário ao certificado antes de criar
 */
export class CreateCommentUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly commentRepository: CertificateCommentRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(request: CreateCommentRequestDto): Promise<Result<CertificateCommentEntity>> {
    this.logger.debug('Criando comentário em certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Valida conteúdo do comentário
    const trimmedContent = request.content.trim();
    if (!trimmedContent) {
      this.logger.warn('Tentativa de criar comentário vazio', {
        certificateId: request.certificateId,
        userId: request.userId,
      });
      return failure('Conteúdo do comentário não pode ser vazio');
    }

    // Verifica se o certificado existe e se o usuário tem acesso
    const certificateResult = await this.certificateRepository.findById(request.certificateId);
    if (!certificateResult.success) {
      return failure(certificateResult.error);
    }

    if (!certificateResult.data) {
      this.logger.warn('Certificado não encontrado para comentário', {
        certificateId: request.certificateId,
      });
      return failure(CertificateError.CERTIFICATE_NOT_FOUND);
    }

    // Clientes só podem comentar em seus próprios certificados
    if (request.userRole === 'client' && certificateResult.data.userId !== request.userId) {
      this.logger.warn('Cliente tentando comentar em certidão de outro usuário', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificateResult.data.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    // Cria o comentário
    const createResult = await this.commentRepository.create({
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
      userName: request.userName,
      content: trimmedContent,
    });

    if (!createResult.success) {
      return failure(createResult.error);
    }

    this.logger.info('Comentário criado com sucesso', {
      commentId: createResult.data.id,
      certificateId: request.certificateId,
      userId: request.userId,
    });

    return createResult;
  }
}
