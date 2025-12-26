import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateTagRepositoryContract,
  CertificateTagData,
  UpdateTagParams,
} from '../../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Caso de uso para atualização de tag de certidão
 * Responsabilidade única: orquestrar a atualização de uma tag existente
 */
export class UpdateTagUseCase {
  constructor(
    private readonly repository: CertificateTagRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string, params: UpdateTagParams): Promise<Result<CertificateTagData>> {
    this.logger.debug('Atualizando tag de certidão', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
