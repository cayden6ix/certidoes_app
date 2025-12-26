import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateTagRepositoryContract } from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para associação de tag a um certificado
 * Responsabilidade única: orquestrar a associação de uma tag a um certificado
 */
export class AssignTagUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(certificateId: string, tagId: string): Promise<Result<void>> {
    this.logger.debug('Associando tag ao certificado', { certificateId, tagId });

    return this.repository.assignTagToCertificate(certificateId, tagId);
  }
}
