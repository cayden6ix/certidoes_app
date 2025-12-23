import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateEventEntity } from '../../1-domain/entities/certificate-event.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { ListCertificateEventsRequestDto } from '../dto/list-certificate-events-request.dto';

/**
 * Use Case para listagem de eventos de certidão
 */
export class ListCertificateEventsUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    request: ListCertificateEventsRequestDto,
  ): Promise<Result<CertificateEventEntity[]>> {
    this.logger.debug('Iniciando listagem de eventos de certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    const certificateResult = await this.certificateRepository.findById(
      request.certificateId,
    );

    if (!certificateResult.success) {
      return failure(certificateResult.error);
    }

    const certificate = certificateResult.data;
    const isAdmin = request.userRole === 'admin';
    const isOwner = certificate.isOwnedBy(request.userId);

    if (!isAdmin && !isOwner) {
      this.logger.warn('Acesso negado aos eventos da certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    const eventsResult = await this.certificateEventRepository.listByCertificateId(
      request.certificateId,
    );

    if (!eventsResult.success) {
      this.logger.error('Erro ao listar eventos da certidão', {
        certificateId: request.certificateId,
        error: eventsResult.error,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }

    return eventsResult;
  }
}
