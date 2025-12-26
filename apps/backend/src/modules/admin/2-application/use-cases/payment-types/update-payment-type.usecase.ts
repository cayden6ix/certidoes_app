import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  PaymentTypeRepositoryContract,
  UpdatePaymentTypeParams,
  PaymentTypeData,
} from '../../../1-domain/contracts/payment-type.repository.contract';

/**
 * Caso de uso para atualização de forma de pagamento
 * Responsabilidade única: orquestrar a atualização de forma de pagamento
 */
export class UpdatePaymentTypeUseCase {
  constructor(
    private readonly repository: PaymentTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(id: string, params: UpdatePaymentTypeParams): Promise<Result<PaymentTypeData>> {
    this.logger.debug('Atualizando forma de pagamento', { id, fields: Object.keys(params) });

    return this.repository.update(id, params);
  }
}
