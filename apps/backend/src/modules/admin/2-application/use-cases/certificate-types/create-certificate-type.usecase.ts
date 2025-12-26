import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTypeRepositoryContract,
  CreateCertificateTypeParams,
  CertificateTypeData,
} from '../../../1-domain/contracts/certificate-type.repository.contract';

/**
 * Caso de uso para criação de tipo de certidão
 * Responsabilidade única: orquestrar a criação de tipos de certidão
 */
export class CreateCertificateTypeUseCase {
  constructor(
    private readonly repository: CertificateTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreateCertificateTypeParams): Promise<Result<CertificateTypeData>> {
    this.logger.debug('Criando tipo de certidão', { name: params.name });

    return this.repository.create(params);
  }
}
