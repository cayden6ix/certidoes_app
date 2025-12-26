import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusValidationRepositoryContract,
  UpdateStatusValidationParams,
  CertificateStatusValidationData,
} from '../../../1-domain/contracts/certificate-status-validation.repository.contract';

/**
 * Caso de uso para atualização de validação por status
 * Responsabilidade única: orquestrar a atualização de validação por status
 */
export class UpdateStatusValidationUseCase {
  constructor(
    private readonly repository: CertificateStatusValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    id: string,
    params: UpdateStatusValidationParams,
  ): Promise<Result<CertificateStatusValidationData>> {
    this.logger.debug('Atualizando validação por status', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
