import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { CertificateEventEntity } from '../entities/certificate-event.entity';

/**
 * DTO para criação de evento de certidão no repositório
 */
export interface CreateCertificateEventData {
  certificateId: string;
  actorUserId: string;
  actorRole: 'client' | 'admin';
  eventType: string;
  changes?: Record<string, unknown> | null;
}

/**
 * Contrato para repositório de eventos de certidões
 */
export interface CertificateEventRepositoryContract {
  create(data: CreateCertificateEventData): Promise<Result<CertificateEventEntity>>;
  listByCertificateId(certificateId: string): Promise<Result<CertificateEventEntity[]>>;
}
