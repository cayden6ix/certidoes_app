import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  ValidationRepositoryContract,
  CreateValidationParams,
  ValidationData,
} from '../../../1-domain/contracts/validation.repository.contract';
import { ValidationRepositoryError } from '../../../4-infrastructure/repository-adapters/supabase-validation.repository';

/**
 * Caso de uso para criação de validação
 * Responsabilidade única: orquestrar a criação de validação com verificação de duplicidade
 */
export class CreateValidationUseCase {
  constructor(
    private readonly repository: ValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreateValidationParams): Promise<Result<ValidationData>> {
    this.logger.debug('Criando validação', { name: params.name });

    // Verifica se já existe validação com mesmo nome
    const existingResult = await this.repository.findByName(params.name);

    if (!existingResult.success) {
      return failure(existingResult.error);
    }

    if (existingResult.data !== null) {
      return failure(ValidationRepositoryError.VALIDATION_ALREADY_EXISTS);
    }

    return this.repository.create(params);
  }
}
