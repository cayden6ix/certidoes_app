import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { UpdateCertificateRequestDto } from '../dto/update-certificate-request.dto';

/**
 * Use Case para atualização de certidão
 * Aplica regras de acesso e restrições de campos baseadas no role
 */
export class UpdateCertificateUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa a atualização de uma certidão
   * @param request - DTO com dados de atualização
   * @returns Result com a entidade atualizada ou erro
   */
  async execute(request: UpdateCertificateRequestDto): Promise<Result<CertificateEntity>> {
    this.logger.debug('Iniciando atualização de certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Busca certidão existente
    const findResult = await this.certificateRepository.findById(request.certificateId);

    if (!findResult.success) {
      this.logger.warn('Certidão não encontrada para atualização', {
        certificateId: request.certificateId,
        userId: request.userId,
      });
      return findResult;
    }

    const certificate = findResult.data;

    // Verifica permissão de acesso
    const isAdmin = request.userRole === 'admin';
    const isOwner = certificate.isOwnedBy(request.userId);

    if (!isAdmin && !isOwner) {
      this.logger.warn('Acesso negado para atualização de certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificate.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    // Verifica se pode ser editada
    if (!certificate.canBeEdited() && !isAdmin) {
      this.logger.warn('Certidão não pode ser editada', {
        certificateId: request.certificateId,
        status: certificate.status.getValue(),
      });
      return failure(CertificateError.CERTIFICATE_CANNOT_BE_EDITED);
    }

    // Filtra campos que cliente NÃO pode editar
    // Cliente não pode alterar: status, cost, additionalCost, orderNumber, paymentDate, paymentTypeId
    const allowedData = isAdmin
      ? request.data
      : {
          certificateType: request.data.certificateType,
          recordNumber: request.data.recordNumber,
          partiesName: request.data.partiesName,
          notes: request.data.notes,
          priority: request.data.priority,
        };

    // Remove campos undefined
    const cleanData = Object.fromEntries(
      Object.entries(allowedData).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(cleanData).length === 0) {
      this.logger.debug('Nenhum campo para atualizar', {
        certificateId: request.certificateId,
      });
      return findResult; // Retorna a certidão sem alterações
    }

    // Atualiza no repositório
    const updateResult = await this.certificateRepository.update(request.certificateId, cleanData);

    if (!updateResult.success) {
      this.logger.error('Erro ao atualizar certidão', {
        certificateId: request.certificateId,
        error: updateResult.error,
      });
      return updateResult;
    }

    this.logger.info('Certidão atualizada com sucesso', {
      certificateId: request.certificateId,
      userId: request.userId,
      updatedFields: Object.keys(cleanData),
    });

    const changeFields = Object.keys(cleanData);
    const previousSnapshot = {
      certificateType: certificate.certificateType,
      recordNumber: certificate.recordNumber,
      partiesName: certificate.partiesName,
      notes: certificate.notes,
      priority: certificate.priority.getValue(),
      status: certificate.status.getValue(),
      cost: certificate.cost,
      additionalCost: certificate.additionalCost,
      orderNumber: certificate.orderNumber,
      paymentType: certificate.paymentType,
      paymentDate: certificate.paymentDate ? certificate.paymentDate.toISOString() : null,
    };
    const updatedSnapshot = {
      certificateType: updateResult.data.certificateType,
      recordNumber: updateResult.data.recordNumber,
      partiesName: updateResult.data.partiesName,
      notes: updateResult.data.notes,
      priority: updateResult.data.priority.getValue(),
      status: updateResult.data.status.getValue(),
      cost: updateResult.data.cost,
      additionalCost: updateResult.data.additionalCost,
      orderNumber: updateResult.data.orderNumber,
      paymentType: updateResult.data.paymentType,
      paymentDate: updateResult.data.paymentDate
        ? updateResult.data.paymentDate.toISOString()
        : null,
    };

    const changes = changeFields.reduce<Record<string, unknown>>((acc, field) => {
      if (field === 'paymentTypeId') {
        acc.paymentType = {
          before: certificate.paymentType ?? certificate.paymentTypeId ?? null,
          after:
            updateResult.data.paymentType ??
            updateResult.data.paymentTypeId ??
            cleanData.paymentTypeId ??
            null,
        };
        return acc;
      }

      acc[field] = {
        before: (previousSnapshot as Record<string, unknown>)[field],
        after: (updatedSnapshot as Record<string, unknown>)[field],
      };
      return acc;
    }, {});

    const eventType =
      changeFields.length === 1 && changeFields[0] === 'status' ? 'status_changed' : 'updated';

    const eventResult = await this.certificateEventRepository.create({
      certificateId: request.certificateId,
      actorUserId: request.userId,
      actorRole: request.userRole,
      eventType,
      changes,
    });

    if (!eventResult.success) {
      this.logger.warn('Falha ao registrar evento de atualização de certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
        error: eventResult.error,
      });
    }

    return updateResult;
  }
}
