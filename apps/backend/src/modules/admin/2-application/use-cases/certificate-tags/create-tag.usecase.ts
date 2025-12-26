import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTagRepositoryContract,
  CertificateTagData,
  CreateTagParams,
} from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para criação de tag de certidão
 * Responsabilidade única: orquestrar a criação de uma nova tag
 */
export class CreateTagUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreateTagParams): Promise<Result<CertificateTagData>> {
    this.logger.debug('Criando tag de certidão', { name: params.name });

    return this.repository.create(params);
  }
}
