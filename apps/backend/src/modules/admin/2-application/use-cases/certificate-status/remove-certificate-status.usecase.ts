import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateStatusRepositoryContract } from '../../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Caso de uso para remoção de status de certidão
 * Responsabilidade única: orquestrar a remoção de status de certidão
 * Inclui validação de uso antes de remover
 */
export class RemoveCertificateStatusUseCase {
  constructor(
    private readonly repository: CertificateStatusRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo status de certidão', { id });

    // Verifica se há certidões usando este status
    const countResult = await this.repository.countCertificatesUsingStatus(id);

    if (!countResult.success) {
      return countResult;
    }

    if (countResult.data > 0) {
      return failure(
        `Não é possível remover este status pois existem ${countResult.data} certidão(ões) utilizando-o`,
      );
    }

    return this.repository.remove(id);
  }
}
