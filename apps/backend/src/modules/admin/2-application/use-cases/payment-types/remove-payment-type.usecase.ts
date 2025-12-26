import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type { PaymentTypeRepositoryContract } from '../../../1-domain/contracts/payment-type.repository.contract';

/**
 * Caso de uso para remoção de forma de pagamento
 * Responsabilidade única: orquestrar a remoção de forma de pagamento
 */
export class RemovePaymentTypeUseCase {
  constructor(
    private readonly repository: PaymentTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    this.logger.debug('Removendo forma de pagamento', { id });

    return this.repository.remove(id);
  }
}
