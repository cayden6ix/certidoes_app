import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateTagRepositoryContract } from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Contrato do repositório de eventos de certificado para auditoria
 */
export interface CertificateEventRepositoryContract {
  createTagChangeEvent(
    certificateId: string,
    actorUserId: string,
    previousTags: string[],
    newTags: string[],
  ): Promise<Result<void>>;
}

/**
 * Token de injeção de dependência para o repositório de eventos
 */
export const CERTIFICATE_EVENT_REPOSITORY = Symbol('CERTIFICATE_EVENT_REPOSITORY');

/**
 * Caso de uso para atualização de todas as tags de um certificado
 * Responsabilidade única: orquestrar a atualização das tags e registro de auditoria
 */
export class UpdateCertificateTagsUseCase {
  constructor(
    private readonly tagRepository: CertificateTagRepositoryContract,
    private readonly eventRepository: CertificateEventRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    certificateId: string,
    tagIds: string[],
    actorUserId?: string,
  ): Promise<Result<void>> {
    this.logger.debug('Atualizando tags do certificado', {
      certificateId,
      tagCount: tagIds.length,
    });

    const updateResult = await this.tagRepository.updateCertificateTags(certificateId, tagIds);

    if (!updateResult.success) {
      return failure(updateResult.error);
    }

    const { previousTags, newTags } = updateResult.data;

    // Registra evento de auditoria se houver mudança e actor
    if (actorUserId) {
      const tagsChanged =
        previousTags.length !== newTags.length ||
        !previousTags.every((tag) => newTags.includes(tag));

      if (tagsChanged) {
        const eventResult = await this.eventRepository.createTagChangeEvent(
          certificateId,
          actorUserId,
          previousTags,
          newTags,
        );

        if (!eventResult.success) {
          // Apenas loga o erro, não falha a operação principal
          this.logger.warn('Falha ao registrar evento de alteração de tags', {
            error: eventResult.error,
            certificateId,
          });
        }
      }
    }

    return success(undefined);
  }
}
