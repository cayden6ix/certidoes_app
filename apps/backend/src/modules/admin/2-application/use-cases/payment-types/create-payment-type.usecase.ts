import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  PaymentTypeRepositoryContract,
  CreatePaymentTypeParams,
  PaymentTypeData,
} from '../../../1-domain/contracts/payment-type.repository.contract';

/**
 * Caso de uso para criação de forma de pagamento
 * Responsabilidade única: orquestrar a criação de forma de pagamento
 */
export class CreatePaymentTypeUseCase {
  constructor(
    private readonly repository: PaymentTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: CreatePaymentTypeParams): Promise<Result<PaymentTypeData>> {
    this.logger.debug('Criando forma de pagamento', { name: params.name });

    return this.repository.create(params);
  }
}
