import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { CertificateEventRepositoryContract } from '../../2-application/use-cases/certificate-tags/update-certificate-tags.usecase';

/**
 * Implementação do repositório de eventos de certificado usando Supabase
 * Responsável por criar eventos de auditoria para alterações em certificados
 */
export class SupabaseCertificateEventRepository implements CertificateEventRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async createTagChangeEvent(
    certificateId: string,
    actorUserId: string,
    previousTags: string[],
    newTags: string[],
  ): Promise<Result<void>> {
    const { error } = await this.supabase.from('certificate_events').insert({
      certificate_id: certificateId,
      actor_user_id: actorUserId,
      actor_role: 'admin',
      event_type: 'tags_updated',
      changes: {
        tags: {
          before: previousTags.length > 0 ? previousTags.join(', ') : 'Nenhuma',
          after: newTags.length > 0 ? newTags.join(', ') : 'Nenhuma',
        },
      },
    });

    if (error) {
      this.logger.error('Erro ao criar evento de alteração de tags', {
        error: error.message,
        certificateId,
      });
      return failure('Não foi possível registrar o evento de alteração de tags');
    }

    return success(undefined);
  }
}
