import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateStatusValidationRepositoryContract } from '../../../1-domain/contracts/certificate-status-validation.repository.contract';

/**
 * Caso de uso para remoção de validação por status
 * Responsabilidade única: orquestrar a remoção de validação por status
 */
export class RemoveStatusValidationUseCase {
  constructor(
    private readonly repository: CertificateStatusValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo validação por status', { id });

    return this.repository.remove(id);
  }
}
