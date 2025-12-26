import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  ValidationRepositoryContract,
  UpdateValidationParams,
  ValidationData,
} from '../../../1-domain/contracts/validation.repository.contract';

/**
 * Caso de uso para atualização de validação
 * Responsabilidade única: orquestrar a atualização de validação
 */
export class UpdateValidationUseCase {
  constructor(
    private readonly repository: ValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string, params: UpdateValidationParams): Promise<Result<ValidationData>> {
    this.logger.debug('Atualizando validação', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
