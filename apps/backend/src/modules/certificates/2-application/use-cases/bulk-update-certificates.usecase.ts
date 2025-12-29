import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateTagRepositoryContract } from '../../../admin/1-domain/contracts/certificate-tag.repository.contract';
import type { CertificateCommentRepositoryContract } from '../../1-domain/contracts/certificate-comment.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import { CertificateBulkValidationService } from '../../1-domain/services/certificate-bulk-validation.service';
import { CertificateChangeTrackingService } from '../../1-domain/services/certificate-change-tracking.service';
import type { BulkUpdateCertificatesRequestDto } from '../dto/bulk-update-certificates-request.dto';
import type {
  BulkUpdateCertificatesResponseDto,
  FailedCertificateUpdate,
} from '../dto/bulk-update-certificates-response.dto';

/**
 * Limite maximo de certidoes por operacao em massa
 */
const BULK_UPDATE_MAX_LIMIT = 50;

/**
 * Use Case para atualizacao em massa de certidoes
 * Aplica regras de acesso e validacao para cada certidao
 * Rastreia eventos de auditoria individualmente
 */
export class BulkUpdateCertificatesUseCase {
  private readonly bulkValidation: CertificateBulkValidationService;
  private readonly changeTracking: CertificateChangeTrackingService;

  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly certificateEventRepository: CertificateEventRepositoryContract,
    private readonly certificateTagRepository: CertificateTagRepositoryContract,
    private readonly certificateCommentRepository: CertificateCommentRepositoryContract,
    private readonly logger: LoggerContract,
  ) {
    this.bulkValidation = new CertificateBulkValidationService();
    this.changeTracking = new CertificateChangeTrackingService();
  }

  /**
   * Executa a atualizacao em massa de certidoes
   * @param request - DTO com dados de atualizacao
   * @returns Result com o resumo da operacao ou erro
   */
  async execute(
    request: BulkUpdateCertificatesRequestDto,
  ): Promise<Result<BulkUpdateCertificatesResponseDto>> {
    this.logger.info('Iniciando atualização em massa de certidões', {
      userId: request.userId,
      certificateCount: request.certificateIds.length,
    });

    // Validacao: lista vazia
    if (request.certificateIds.length === 0) {
      return failure(CertificateError.BULK_UPDATE_EMPTY_LIST);
    }

    // Validacao: limite maximo
    if (request.certificateIds.length > BULK_UPDATE_MAX_LIMIT) {
      return failure(CertificateError.BULK_UPDATE_MAX_LIMIT_EXCEEDED);
    }

    // Busca todas as certidoes
    const certificatesResult = await this.fetchCertificates(request.certificateIds);
    if (!certificatesResult.success) {
      return failure(certificatesResult.error);
    }

    // Valida quais podem ser editadas
    const validationResult = this.bulkValidation.validateForBulkUpdate(certificatesResult.data);

    // Se houver bloqueadas, retorna erro com detalhes
    if (this.bulkValidation.hasBlockedCertificates(validationResult)) {
      this.logger.warn('Atualização em massa bloqueada: certidões não podem ser editadas', {
        userId: request.userId,
        blockedCount: validationResult.blockedCertificates.length,
        blockedCertificates: validationResult.blockedCertificates,
      });

      return failure(CertificateError.BULK_UPDATE_CERTIFICATES_BLOCKED, {
        blockedCertificates: validationResult.blockedCertificates,
      });
    }

    // Processa atualizacoes
    const updateResults = await this.processUpdates(validationResult.validCertificates, request);

    // Processa tags globais se houver
    if (request.globalData.tagIds && request.globalData.tagIds.length > 0) {
      await this.updateTagsForCertificates(
        updateResults.updatedCertificates,
        request.globalData.tagIds,
        request.userId,
      );
    }

    // Adiciona comentario global se houver
    this.logger.debug('Verificando comentário global', {
      hasComment: !!request.globalData.comment,
      commentContent: request.globalData.comment,
    });
    if (request.globalData.comment && request.globalData.comment.trim() !== '') {
      this.logger.info('Adicionando comentário global em massa', {
        comment: request.globalData.comment.substring(0, 50),
        certificateCount: updateResults.updatedCertificates.length,
      });
      await this.createCommentsForCertificates(
        updateResults.updatedCertificates,
        request.globalData.comment,
        request.userId,
        request.userRole,
      );
    }

    this.logger.info('Atualização em massa concluída', {
      userId: request.userId,
      successCount: updateResults.updatedCertificates.length,
      failedCount: updateResults.failedCertificates.length,
    });

    return success({
      successCount: updateResults.updatedCertificates.length,
      failedCount: updateResults.failedCertificates.length,
      blockedCount: validationResult.blockedCertificates.length,
      updatedCertificates: updateResults.updatedCertificates.map((c) => c.toDTO()),
      failedCertificates: updateResults.failedCertificates,
      blockedCertificates: validationResult.blockedCertificates,
    });
  }

  /**
   * Busca multiplas certidoes por IDs
   */
  private async fetchCertificates(ids: string[]): Promise<Result<CertificateEntity[]>> {
    const certificates: CertificateEntity[] = [];
    const notFoundIds: string[] = [];

    for (const id of ids) {
      const result = await this.certificateRepository.findById(id);
      if (!result.success) {
        notFoundIds.push(id);
        continue;
      }
      certificates.push(result.data);
    }

    if (notFoundIds.length > 0) {
      this.logger.warn('Algumas certidões não foram encontradas', {
        notFoundIds,
        foundCount: certificates.length,
      });
      return failure(CertificateError.CERTIFICATE_NOT_FOUND);
    }

    return success(certificates);
  }

  /**
   * Processa atualizacoes para cada certidao valida
   */
  private async processUpdates(
    certificates: CertificateEntity[],
    request: BulkUpdateCertificatesRequestDto,
  ): Promise<{
    updatedCertificates: CertificateEntity[];
    failedCertificates: FailedCertificateUpdate[];
  }> {
    const updatedCertificates: CertificateEntity[] = [];
    const failedCertificates: FailedCertificateUpdate[] = [];

    for (const certificate of certificates) {
      const updateData = this.buildUpdateDataForCertificate(certificate.id, request);

      // Pula se nao ha dados para atualizar
      if (Object.keys(updateData).length === 0) {
        updatedCertificates.push(certificate);
        continue;
      }

      const updateResult = await this.certificateRepository.update(certificate.id, updateData);

      if (!updateResult.success) {
        failedCertificates.push({
          certificateId: certificate.id,
          recordNumber: certificate.recordNumber,
          error: updateResult.error,
        });
        continue;
      }

      // Registra evento de auditoria
      await this.recordAuditEvent(certificate, updateResult.data, updateData, request);
      updatedCertificates.push(updateResult.data);
    }

    return { updatedCertificates, failedCertificates };
  }

  /**
   * Constroi os dados de atualizacao para uma certidao especifica
   * Combina dados globais com dados individuais
   */
  private buildUpdateDataForCertificate(
    certificateId: string,
    request: BulkUpdateCertificatesRequestDto,
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};

    // Aplica dados globais (notes)
    if (request.globalData.notes !== undefined && request.globalData.notes.trim() !== '') {
      updateData.notes = request.globalData.notes;
    }

    // Busca dados individuais para esta certidao
    const individualData = request.individualUpdates.find((u) => u.certificateId === certificateId);

    if (individualData) {
      if (individualData.status !== undefined) {
        updateData.status = individualData.status;
      }
      if (individualData.cost !== undefined) {
        updateData.cost = individualData.cost;
      }
      if (individualData.additionalCost !== undefined) {
        updateData.additionalCost = individualData.additionalCost;
      }
      if (individualData.orderNumber !== undefined) {
        updateData.orderNumber = individualData.orderNumber;
      }
      if (individualData.paymentDate !== undefined) {
        updateData.paymentDate = individualData.paymentDate;
      }
      if (individualData.paymentTypeId !== undefined) {
        updateData.paymentTypeId = individualData.paymentTypeId;
      }
      if (individualData.priority !== undefined) {
        updateData.priority = individualData.priority;
      }
    }

    return updateData;
  }

  /**
   * Atualiza tags para multiplas certidoes
   */
  private async updateTagsForCertificates(
    certificates: CertificateEntity[],
    tagIds: string[],
    actorUserId: string,
  ): Promise<void> {
    for (const certificate of certificates) {
      const tagResult = await this.certificateTagRepository.updateCertificateTags(
        certificate.id,
        tagIds,
      );

      if (!tagResult.success) {
        this.logger.warn('Falha ao atualizar tags da certidão', {
          certificateId: certificate.id,
          error: tagResult.error,
        });
        continue;
      }

      // Registra evento de mudanca de tags se houve alteracao
      const { previousTags, newTags } = tagResult.data;
      const tagsChanged =
        previousTags.length !== newTags.length ||
        !previousTags.every((tag) => newTags.includes(tag));

      if (tagsChanged) {
        await this.certificateEventRepository.create({
          certificateId: certificate.id,
          actorUserId,
          actorRole: 'admin',
          eventType: 'tags_changed',
          changes: {
            bulkOperation: true,
            previousTags,
            newTags,
          },
        });
      }
    }
  }

  /**
   * Registra evento de auditoria para atualizacao em massa
   */
  private async recordAuditEvent(
    originalCertificate: CertificateEntity,
    updatedCertificate: CertificateEntity,
    updateData: Record<string, unknown>,
    request: BulkUpdateCertificatesRequestDto,
  ): Promise<void> {
    const changedFields = Object.keys(updateData);
    const eventType = 'bulk_updated';

    const previousSnapshot = this.changeTracking.createSnapshot(originalCertificate);
    const updatedSnapshot = this.changeTracking.createUpdatedSnapshot(
      updatedCertificate,
      updateData,
    );
    const changes = this.changeTracking.calculateChanges(
      previousSnapshot,
      updatedSnapshot,
      changedFields,
    );

    const eventResult = await this.certificateEventRepository.create({
      certificateId: originalCertificate.id,
      actorUserId: request.userId,
      actorRole: request.userRole,
      eventType,
      changes: {
        ...changes,
        bulkOperation: true,
        totalCertificates: request.certificateIds.length,
      },
    });

    if (!eventResult.success) {
      this.logger.warn('Falha ao registrar evento de atualização em massa', {
        certificateId: originalCertificate.id,
        userId: request.userId,
        error: eventResult.error,
      });
    }
  }

  /**
   * Cria comentarios para multiplas certidoes
   */
  private async createCommentsForCertificates(
    certificates: CertificateEntity[],
    comment: string,
    actorUserId: string,
    actorRole: 'client' | 'admin',
  ): Promise<void> {
    for (const certificate of certificates) {
      const commentResult = await this.certificateCommentRepository.create({
        certificateId: certificate.id,
        userId: actorUserId,
        userRole: actorRole,
        userName: 'Admin', // Nome generico para operacao em massa
        content: comment,
      });

      if (!commentResult.success) {
        this.logger.warn('Falha ao criar comentário na certidão', {
          certificateId: certificate.id,
          error: commentResult.error,
        });
        continue;
      }

      // Registra evento de comentario adicionado
      await this.certificateEventRepository.create({
        certificateId: certificate.id,
        actorUserId,
        actorRole,
        eventType: 'comment_added',
        changes: {
          bulkOperation: true,
          commentId: commentResult.data.id,
        },
      });
    }
  }
}
