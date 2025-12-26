import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusRepositoryContract,
  CreateCertificateStatusParams,
  CertificateStatusData,
} from '../../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Caso de uso para criação de status de certidão
 * Responsabilidade única: orquestrar a criação de status de certidão
 */
export class CreateCertificateStatusUseCase {
  constructor(
    private readonly repository: CertificateStatusRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreateCertificateStatusParams): Promise<Result<CertificateStatusData>> {
    this.logger.debug('Criando status de certidão', {
      name: params.name,
      displayName: params.displayName,
    });

    // Verifica se já existe um status com o mesmo nome
    const existingResult = await this.repository.findByName(params.name);

    if (!existingResult.success) {
      return existingResult;
    }

    if (existingResult.data !== null) {
      return failure(`Já existe um status com o nome "${params.name}"`);
    }

    return this.repository.create(params);
  }
}
