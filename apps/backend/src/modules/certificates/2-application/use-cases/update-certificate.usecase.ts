import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { UpdateCertificateRequestDto } from '../dto/update-certificate-request.dto';
import type { CertificateStatusValidationContract } from '../../1-domain/contracts/certificate-status-validation.contract';
import { CertificateAccessControlService } from '../../1-domain/services/certificate-access-control.service';
import { CertificateChangeTrackingService } from '../../1-domain/services/certificate-change-tracking.service';
import { CertificateStatusValidationService } from '../../1-domain/services/certificate-status-validation.service';

/**
 * Use Case para atualização de certidão
 * Aplica regras de acesso e restrições de campos baseadas no role
 */
export class UpdateCertificateUseCase {
  private readonly accessControl: CertificateAccessControlService;
  private readonly changeTracking: CertificateChangeTrackingService;
  private readonly statusValidation: CertificateStatusValidationService;

  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly certificateStatusValidationResolver: CertificateStatusValidationContract,
    private readonly logger: LoggerContract,
  ) {
    // Instancia domain services (sem dependências de infraestrutura)
    this.accessControl = new CertificateAccessControlService();
    this.changeTracking = new CertificateChangeTrackingService();
    this.statusValidation = new CertificateStatusValidationService();
  }

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
      this.logCertificateNotFound(request);
      return findResult;
    }

    const certificate = findResult.data;

    // Verifica permissões de acesso
    const accessResult = this.verifyAccess(certificate, request);
    if (!accessResult.success) {
      return accessResult;
    }

    const { isAdmin } = this.accessControl.checkAccess(
      certificate,
      request.userId,
      request.userRole,
    );

    // Filtra e limpa dados de atualização
    const cleanData = this.prepareUpdateData(request.data, request.userRole);
    if (Object.keys(cleanData).length === 0) {
      this.logger.debug('Nenhum campo para atualizar', { certificateId: request.certificateId });
      return findResult;
    }

    // Valida mudança de status (se aplicável)
    const statusValidationResult = await this.validateStatusChangeIfNeeded(
      certificate,
      cleanData,
      isAdmin,
      request.validation,
    );
    if (!statusValidationResult.success) {
      return statusValidationResult;
    }

    // Executa atualização no repositório
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

    // Registra evento de auditoria
    await this.recordAuditEvent(certificate, updateResult.data, cleanData, request);

    return updateResult;
  }

  /**
   * Verifica permissões de acesso à certidão
   */
  private verifyAccess(
    certificate: CertificateEntity,
    request: UpdateCertificateRequestDto,
  ): Result<void> {
    const access = this.accessControl.checkAccess(certificate, request.userId, request.userRole);

    if (!access.canAccess) {
      this.logger.warn('Acesso negado para atualização de certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificate.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    if (!access.canEdit) {
      this.logger.warn('Certidão não pode ser editada', {
        certificateId: request.certificateId,
        status: certificate.status.getName(),
      });
      return failure(CertificateError.CERTIFICATE_CANNOT_BE_EDITED);
    }

    return { success: true, data: undefined };
  }

  /**
   * Prepara dados de atualização (filtra e limpa)
   */
  private prepareUpdateData(
    data: UpdateCertificateRequestDto['data'],
    userRole: 'client' | 'admin',
  ): Record<string, unknown> {
    const filteredData = this.accessControl.filterFieldsByRole(data, userRole);
    return this.accessControl.cleanUpdateData(filteredData) as Record<string, unknown>;
  }

  /**
   * Valida mudança de status se necessário
   */
  private async validateStatusChangeIfNeeded(
    certificate: CertificateEntity,
    cleanData: Record<string, unknown>,
    isAdmin: boolean,
    validation: UpdateCertificateRequestDto['validation'],
  ): Promise<Result<void>> {
    const nextStatus = this.changeTracking.detectStatusChange(
      certificate.status.getName(),
      cleanData,
      isAdmin,
    );

    if (!nextStatus) {
      return { success: true, data: undefined };
    }

    // Busca validações configuradas para o status
    const validationsResult =
      await this.certificateStatusValidationResolver.fetchActiveValidations(nextStatus);

    if (!validationsResult.success) {
      return failure(validationsResult.error);
    }

    // Valida regras de mudança de status
    const validationResult = this.statusValidation.validateStatusChange(
      validationsResult.data,
      validation,
      certificate,
      cleanData,
    );

    if (!validationResult.isValid) {
      return failure(
        validationResult.errorCode === 'CONFIRMATION_REQUIRED'
          ? CertificateError.STATUS_VALIDATION_CONFIRMATION_REQUIRED
          : CertificateError.STATUS_VALIDATION_REQUIRED_FIELD,
      );
    }

    return { success: true, data: undefined };
  }

  /**
   * Registra evento de auditoria
   */
  private async recordAuditEvent(
    originalCertificate: CertificateEntity,
    updatedCertificate: CertificateEntity,
    cleanData: Record<string, unknown>,
    request: UpdateCertificateRequestDto,
  ): Promise<void> {
    const previousSnapshot = this.changeTracking.createSnapshot(originalCertificate);
    const updatedSnapshot = this.changeTracking.createUpdatedSnapshot(
      updatedCertificate,
      cleanData,
    );
    const changedFields = Object.keys(cleanData);
    const changes = this.changeTracking.calculateChanges(
      previousSnapshot,
      updatedSnapshot,
      changedFields,
    );
    const eventType = this.changeTracking.determineEventType(changedFields);

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
  }

  /**
   * Log helper para certidão não encontrada
   */
  private logCertificateNotFound(request: UpdateCertificateRequestDto): void {
    this.logger.warn('Certidão não encontrada para atualização', {
      certificateId: request.certificateId,
      userId: request.userId,
    });
  }
}
