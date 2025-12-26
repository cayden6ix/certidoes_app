import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { UpdateCertificateRequestDto } from '../dto/update-certificate-request.dto';
import type { CertificateStatusValidationContract } from '../../1-domain/contracts/certificate-status-validation.contract';

/**
 * Use Case para atualização de certidão
 * Aplica regras de acesso e restrições de campos baseadas no role
 */
export class UpdateCertificateUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly certificateStatusValidation: CertificateStatusValidationContract,
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
        status: certificate.status.getName(),
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

    // Normaliza strings vazias para não gerar mudanças fictícias
    for (const key of Object.keys(cleanData)) {
      const value = cleanData[key as keyof typeof cleanData];
      if (typeof value === 'string' && value.trim() === '') {
        delete cleanData[key as keyof typeof cleanData];
      }
    }

    if (Object.keys(cleanData).length === 0) {
      this.logger.debug('Nenhum campo para atualizar', {
        certificateId: request.certificateId,
      });
      return findResult; // Retorna a certidão sem alterações
    }

    const nextStatus =
      typeof cleanData.status === 'string' && cleanData.status.trim()
        ? cleanData.status.trim()
        : undefined;
    const isStatusChanging =
      isAdmin && nextStatus !== undefined && nextStatus !== certificate.status.getName();

    if (isStatusChanging && nextStatus) {
      const validationsResult =
        await this.certificateStatusValidation.fetchActiveValidations(nextStatus);

      if (!validationsResult.success) {
        return failure(validationsResult.error);
      }

      const validationRules = validationsResult.data;
      if (validationRules.length > 0) {
        const fallbackStatement = 'Eu verifiquei e confirmei as mudanças que estou prestes a fazer';
        const configuredStatements = validationRules
          .map((rule) => rule.confirmationText)
          .filter((value): value is string => Boolean(value?.trim()))
          .map((value) => value.trim());
        const uniqueStatements = [...new Set(configuredStatements)];
        const requiredStatement =
          uniqueStatements.length > 0 ? uniqueStatements[0] : fallbackStatement;
        const confirmed = request.validation?.confirmed === true;
        const statementMatches = (request.validation?.statement ?? '').trim() === requiredStatement;

        if (uniqueStatements.length > 1 || !confirmed || !statementMatches) {
          return failure(CertificateError.STATUS_VALIDATION_CONFIRMATION_REQUIRED);
        }

        const isValueFilled = (value: unknown): boolean => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'string') return value.trim() !== '';
          return true;
        };

        for (const rule of validationRules) {
          if (!rule.requiredField) continue;
          const fieldKey = rule.requiredField as keyof typeof cleanData;
          const certificateRecord = certificate as unknown as Record<string, unknown>;
          const candidateValue =
            fieldKey in cleanData ? cleanData[fieldKey] : certificateRecord[fieldKey as string];

          if (!isValueFilled(candidateValue)) {
            return failure(CertificateError.STATUS_VALIDATION_REQUIRED_FIELD);
          }
        }
      }
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

    const previousSnapshot = {
      certificateType: certificate.certificateType,
      recordNumber: certificate.recordNumber,
      partiesName: certificate.partiesName,
      notes: certificate.notes,
      priority: certificate.priority.getValue(),
      status: certificate.status.getName(),
      cost: certificate.cost,
      additionalCost: certificate.additionalCost,
      orderNumber: certificate.orderNumber,
      paymentType: certificate.paymentType ?? certificate.paymentTypeId ?? null,
      paymentTypeId: certificate.paymentTypeId ?? null,
      paymentDate: certificate.paymentDate ? certificate.paymentDate.toISOString() : null,
    };
    const updatedSnapshot = {
      certificateType: updateResult.data.certificateType,
      recordNumber: updateResult.data.recordNumber,
      partiesName: updateResult.data.partiesName,
      notes: updateResult.data.notes,
      priority: updateResult.data.priority.getValue(),
      status: updateResult.data.status.getName(),
      cost: updateResult.data.cost,
      additionalCost: updateResult.data.additionalCost,
      orderNumber: updateResult.data.orderNumber,
      paymentType:
        updateResult.data.paymentType ??
        updateResult.data.paymentTypeId ??
        cleanData.paymentTypeId ??
        null,
      paymentTypeId: updateResult.data.paymentTypeId ?? cleanData.paymentTypeId ?? null,
      paymentDate: updateResult.data.paymentDate
        ? updateResult.data.paymentDate.toISOString()
        : null,
    };

    const normalizeEmpty = (value: unknown): unknown => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    };

    const changeFields = Object.keys(cleanData);

    const changes = changeFields.reduce<Record<string, unknown>>((acc, field) => {
      if (field === 'status') {
        acc[field] = {
          before: normalizeEmpty(previousSnapshot.status),
          after: normalizeEmpty(updatedSnapshot.status ?? cleanData.status ?? null),
        };
      } else {
        acc[field] = {
          before: normalizeEmpty((previousSnapshot as Record<string, unknown>)[field]),
          after: normalizeEmpty((updatedSnapshot as Record<string, unknown>)[field]),
        };
      }
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
