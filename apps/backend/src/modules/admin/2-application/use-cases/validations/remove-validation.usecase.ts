import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { ValidationRepositoryContract } from '../../../1-domain/contracts/validation.repository.contract';

/**
 * Caso de uso para remoção de validação
 * Responsabilidade única: orquestrar a remoção de validação
 */
export class RemoveValidationUseCase {
  constructor(
    private readonly repository: ValidationRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo validação', { id });

    return this.repository.remove(id);
  }
}
