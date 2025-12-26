import type { Result } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import type {
  PaymentTypeRepositoryContract,
  ListPaymentTypesParams,
  PaginatedPaymentTypes,
} from '../../../1-domain/contracts/payment-type.repository.contract';

/**
 * Caso de uso para listagem de formas de pagamento
 * Responsabilidade única: orquestrar a listagem de formas de pagamento
 */
export class ListPaymentTypesUseCase {
  constructor(
    private readonly repository: PaymentTypeRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(params: ListPaymentTypesParams): Promise<Result<PaginatedPaymentTypes>> {
    this.logger.debug('Listando formas de pagamento', {
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    });

    return this.repository.list(params);
  }
}
