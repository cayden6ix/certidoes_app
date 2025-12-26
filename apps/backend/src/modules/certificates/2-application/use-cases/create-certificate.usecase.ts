import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { CreateCertificateRequestDto } from '../dto/create-certificate-request.dto';

/**
 * Use Case para criação de certidão
 * Orquestra a validação e persistência de uma nova certidão
 */
export class CreateCertificateUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa a criação de uma nova certidão
   * @param request - DTO com dados da certidão
   * @returns Result com a entidade criada ou erro
   */
  async execute(request: CreateCertificateRequestDto): Promise<Result<CertificateEntity>> {
    this.logger.debug('Iniciando criação de certidão', {
      userId: request.userId,
      certificateType: request.certificateType,
    });

    // Validações de negócio
    if (!request.certificateType || request.certificateType.trim() === '') {
      this.logger.warn('Tipo de certidão inválido', { userId: request.userId });
      return failure(CertificateError.INVALID_CERTIFICATE_TYPE);
    }

    if (!request.recordNumber || request.recordNumber.trim() === '') {
      this.logger.warn('Número da ficha inválido', { userId: request.userId });
      return failure(CertificateError.INVALID_RECORD_NUMBER);
    }

    if (!request.partiesName || request.partiesName.trim() === '') {
      this.logger.warn('Nome das partes inválido', { userId: request.userId });
      return failure(CertificateError.INVALID_PARTIES_NAME);
    }

    // Cria certidão no repositório
    const result = await this.certificateRepository.create({
      userId: request.userId,
      certificateType: request.certificateType.trim(),
      recordNumber: request.recordNumber.trim(),
      partiesName: request.partiesName.trim(),
      notes: request.notes?.trim() ?? undefined,
      priority: request.priority,
    });

    if (!result.success) {
      this.logger.error('Erro ao criar certidão', {
        userId: request.userId,
        error: result.error,
      });
      return result;
    }

    this.logger.info('Certidão criada com sucesso', {
      certificateId: result.data.id,
      userId: request.userId,
      certificateType: request.certificateType,
    });

    const eventResult = await this.certificateEventRepository.create({
      certificateId: result.data.id,
      actorUserId: request.userId,
      actorRole: request.userRole,
      eventType: 'created',
      changes: {
        after: {
          certificateType: result.data.certificateType,
          recordNumber: result.data.recordNumber,
          partiesName: result.data.partiesName,
          notes: result.data.notes,
          priority: result.data.priority.getValue(),
          status: result.data.status.getName(),
        },
      },
    });

    if (!eventResult.success) {
      this.logger.warn('Falha ao registrar evento de criação de certidão', {
        certificateId: result.data.id,
        userId: request.userId,
        error: eventResult.error,
      });
    }

    return result;
  }
}
