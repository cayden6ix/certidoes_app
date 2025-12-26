import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusRepositoryContract,
  UpdateCertificateStatusParams,
  CertificateStatusData,
} from '../../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Caso de uso para atualização de status de certidão
 * Responsabilidade única: orquestrar a atualização de status de certidão
 */
export class UpdateCertificateStatusUseCase {
  constructor(
    private readonly repository: CertificateStatusRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    id: string,
    params: UpdateCertificateStatusParams,
  ): Promise<Result<CertificateStatusData>> {
    this.logger.debug('Atualizando status de certidão', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
