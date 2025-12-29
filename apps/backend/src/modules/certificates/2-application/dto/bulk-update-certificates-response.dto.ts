import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';

/**
 * Informacao de certidao que falhou na atualizacao
 */
export interface FailedCertificateUpdate {
  certificateId: string;
  recordNumber: string;
  error: string;
}

/**
 * Informacao de certidao bloqueada para atualizacao
 */
export interface BlockedCertificateUpdate {
  certificateId: string;
  recordNumber: string;
  reason: string;
}

/**
 * DTO de resposta para atualizacao em massa de certidoes
 */
export interface BulkUpdateCertificatesResponseDto {
  successCount: number;
  failedCount: number;
  blockedCount: number;
  updatedCertificates: ReturnType<CertificateEntity['toDTO']>[];
  failedCertificates: FailedCertificateUpdate[];
  blockedCertificates: BlockedCertificateUpdate[];
}
