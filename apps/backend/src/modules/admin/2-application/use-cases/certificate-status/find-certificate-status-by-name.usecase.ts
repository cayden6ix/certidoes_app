import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusRepositoryContract,
  CertificateStatusData,
} from '../../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Caso de uso para buscar um status de certidão por nome
 * Responsabilidade única: orquestrar a busca de status por nome
 */
export class FindCertificateStatusByNameUseCase {
  constructor(
    private readonly repository: CertificateStatusRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(name: string): Promise<Result<CertificateStatusData | null>> {
    this.logger.debug('Buscando status de certidão por nome', { name });

    return this.repository.findByName(name);
  }
}
