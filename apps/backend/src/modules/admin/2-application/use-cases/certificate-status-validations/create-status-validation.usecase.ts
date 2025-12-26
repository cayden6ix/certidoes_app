import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateStatusValidationRepositoryContract,
  CreateStatusValidationParams,
  CertificateStatusValidationData,
} from '../../../1-domain/contracts/certificate-status-validation.repository.contract';

/**
 * Caso de uso para criação de validação por status
 * Responsabilidade única: orquestrar a criação de validação por status
 */
export class CreateStatusValidationUseCase {
  constructor(
    private readonly repository: CertificateStatusValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(
    params: CreateStatusValidationParams,
  ): Promise<Result<CertificateStatusValidationData>> {
    this.logger.debug('Criando validação por status', {
      statusId: params.statusId,
      validationId: params.validationId,
    });

    // Verifica se já existe o vínculo
    const existsResult = await this.repository.existsBinding(
      params.statusId,
      params.validationId,
      params.requiredField ?? null,
    );

    if (!existsResult.success) {
      return existsResult;
    }

    if (existsResult.data) {
      return failure('Já existe esse vínculo de validação para o status');
    }

    return this.repository.create(params);
  }
}
