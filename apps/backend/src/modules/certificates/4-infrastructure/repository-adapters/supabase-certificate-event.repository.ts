import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateEventRepositoryContract,
  CreateCertificateEventData,
} from '../../1-domain/contracts/certificate-event.repository.contract';
import { CertificateEventEntity } from '../../1-domain/entities/certificate-event.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

interface CertificateEventRow {
  id: string;
  certificate_id: string;
  actor_user_id: string;
  actor_role: 'client' | 'admin';
  event_type: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Repositório de eventos de certidões com Supabase
 */
export class SupabaseCertificateEventRepository
  implements CertificateEventRepositoryContract
{
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.logger.debug('Repositório de eventos de certidões Supabase inicializado');
  }

  async create(
    data: CreateCertificateEventData,
  ): Promise<Result<CertificateEventEntity>> {
    try {
      const { data: insertedData, error } = await this.supabaseClient
        .from('certificate_events')
        .insert({
          certificate_id: data.certificateId,
          actor_user_id: data.actorUserId,
          actor_role: data.actorRole,
          event_type: data.eventType,
          changes: data.changes ?? null,
        })
        .select()
        .single<CertificateEventRow>();

      if (error || !insertedData) {
        this.logger.error('Erro ao criar evento de certidão', {
          error: error?.message,
          certificateId: data.certificateId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(this.mapToEntity(insertedData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar evento de certidão', {
        error: errorMessage,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  async listByCertificateId(
    certificateId: string,
  ): Promise<Result<CertificateEventEntity[]>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('certificate_events')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Erro ao listar eventos de certidão', {
          error: error.message,
          certificateId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const events = (data as CertificateEventRow[]).map((row) =>
        this.mapToEntity(row),
      );

      return success(events);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar eventos de certidão', {
        error: errorMessage,
        certificateId,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: CertificateEventRow): CertificateEventEntity {
    return CertificateEventEntity.create({
      id: row.id,
      certificateId: row.certificate_id,
      actorUserId: row.actor_user_id,
      actorRole: row.actor_role,
      eventType: row.event_type,
      changes: row.changes ?? null,
      createdAt: new Date(row.created_at),
    });
  }
}
