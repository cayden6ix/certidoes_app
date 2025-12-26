import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTypeRepositoryContract,
  UpdateCertificateTypeParams,
  CertificateTypeData,
} from '../../../1-domain/contracts/certificate-type.repository.contract';

/**
 * Caso de uso para atualização de tipo de certidão
 * Responsabilidade única: orquestrar a atualização de tipos de certidão
 */
export class UpdateCertificateTypeUseCase {
  constructor(
    private readonly repository: CertificateTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    id: string,
    params: UpdateCertificateTypeParams,
  ): Promise<Result<CertificateTypeData>> {
    this.logger.debug('Atualizando tipo de certidão', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
