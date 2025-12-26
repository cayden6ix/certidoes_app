import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateTagRepositoryContract } from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para remoção de tag de certidão
 * Responsabilidade única: orquestrar a remoção de uma tag e seus vínculos
 */
export class RemoveTagUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo tag de certidão', { id });

    return this.repository.remove(id);
  }
}
