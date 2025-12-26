import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateTypeRepositoryContract } from '../../../1-domain/contracts/certificate-type.repository.contract';

/**
 * Caso de uso para remoção de tipo de certidão
 * Responsabilidade única: orquestrar a remoção de tipos de certidão
 */
export class RemoveCertificateTypeUseCase {
  constructor(
    private readonly repository: CertificateTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo tipo de certidão', { id });

    return this.repository.remove(id);
  }
}
