import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateTagRepositoryContract } from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para desassociação de tag de um certificado
 * Responsabilidade única: orquestrar a remoção de uma tag de um certificado
 */
export class UnassignTagUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(certificateId: string, tagId: string): Promise<Result<void>> {
    this.logger.debug('Removendo tag do certificado', { certificateId, tagId });

    return this.repository.unassignTagFromCertificate(certificateId, tagId);
  }
}
