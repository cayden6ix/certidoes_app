import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../../1-domain/contracts/certificate.repository.contract';
import type { CertificateCommentRepositoryContract } from '../../../1-domain/contracts/certificate-comment.repository.contract';
import type { CertificateCommentEntity } from '../../../1-domain/entities/certificate-comment.entity';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import type { ListCommentsRequestDto } from '../../dto/comment-request.dto';

/**
 * Use case para listar comentários de uma certidão
 * Valida acesso do usuário ao certificado antes de listar
 */
export class ListCommentsUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly commentRepository: CertificateCommentRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(request: ListCommentsRequestDto): Promise<Result<CertificateCommentEntity[]>> {
    this.logger.debug('Listando comentários de certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Verifica se o certificado existe e se o usuário tem acesso
    const certificateResult = await this.certificateRepository.findById(request.certificateId);
    if (!certificateResult.success) {
      return failure(certificateResult.error);
    }

    if (!certificateResult.data) {
      this.logger.warn('Certificado não encontrado para listar comentários', {
        certificateId: request.certificateId,
      });
      return failure(CertificateError.CERTIFICATE_NOT_FOUND);
    }

    // Clientes só podem ver comentários de seus próprios certificados
    if (request.userRole === 'client' && certificateResult.data.userId !== request.userId) {
      this.logger.warn('Cliente tentando ver comentários de certidão de outro usuário', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificateResult.data.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    // Lista os comentários
    const listResult = await this.commentRepository.listByCertificateId(request.certificateId);

    if (!listResult.success) {
      return failure(listResult.error);
    }

    this.logger.debug('Comentários listados com sucesso', {
      certificateId: request.certificateId,
      count: listResult.data.length,
    });

    return listResult;
  }
}
