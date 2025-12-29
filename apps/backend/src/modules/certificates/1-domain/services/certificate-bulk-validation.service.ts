import type { CertificateEntity } from '../entities/certificate.entity';

/**
 * Resultado da validacao de certidoes para atualizacao em massa
 */
export interface BulkValidationResult {
  validCertificates: CertificateEntity[];
  blockedCertificates: Array<{
    certificateId: string;
    recordNumber: string;
    reason: string;
  }>;
}

/**
 * Servico de dominio puro para validacao de operacoes em massa
 * Verifica quais certidoes podem ser editadas
 * Nao possui dependencias de infraestrutura (Clean Architecture)
 */
export class CertificateBulkValidationService {
  /**
   * Valida quais certidoes podem ser editadas em massa
   * Bloqueia certidoes com status final ou que nao permitem edicao
   * @param certificates - Lista de certidoes a validar
   * @returns Resultado com certidoes validas e bloqueadas
   */
  validateForBulkUpdate(certificates: CertificateEntity[]): BulkValidationResult {
    const validCertificates: CertificateEntity[] = [];
    const blockedCertificates: BulkValidationResult['blockedCertificates'] = [];

    for (const certificate of certificates) {
      if (certificate.status.isFinal()) {
        blockedCertificates.push({
          certificateId: certificate.id,
          recordNumber: certificate.recordNumber,
          reason: `Certidão em status final (${certificate.status.getDisplayName()})`,
        });
        continue;
      }

      if (!certificate.status.canBeEdited()) {
        blockedCertificates.push({
          certificateId: certificate.id,
          recordNumber: certificate.recordNumber,
          reason: `Status "${certificate.status.getDisplayName()}" não permite edição`,
        });
        continue;
      }

      validCertificates.push(certificate);
    }

    return { validCertificates, blockedCertificates };
  }

  /**
   * Verifica se ha certidoes bloqueadas que impedem a operacao
   * @param result - Resultado da validacao
   * @returns true se houver certidoes bloqueadas
   */
  hasBlockedCertificates(result: BulkValidationResult): boolean {
    return result.blockedCertificates.length > 0;
  }

  /**
   * Retorna quantidade de certidoes validas para edicao
   * @param result - Resultado da validacao
   * @returns Quantidade de certidoes validas
   */
  getValidCount(result: BulkValidationResult): number {
    return result.validCertificates.length;
  }

  /**
   * Retorna quantidade de certidoes bloqueadas
   * @param result - Resultado da validacao
   * @returns Quantidade de certidoes bloqueadas
   */
  getBlockedCount(result: BulkValidationResult): number {
    return result.blockedCertificates.length;
  }
}
