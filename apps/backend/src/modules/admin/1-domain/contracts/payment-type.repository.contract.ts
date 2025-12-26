import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Dados de uma forma de pagamento
 */
export interface PaymentTypeData {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
}

/**
 * Parâmetros para listagem de formas de pagamento
 */
export interface ListPaymentTypesParams {
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Resultado paginado de formas de pagamento
 */
export interface PaginatedPaymentTypes {
  data: PaymentTypeData[];
  total: number;
}

/**
 * Parâmetros para criação de forma de pagamento
 */
export interface CreatePaymentTypeParams {
  name: string;
  enabled?: boolean;
}

/**
 * Parâmetros para atualização de forma de pagamento
 */
export interface UpdatePaymentTypeParams {
  name?: string;
  enabled?: boolean;
}

/**
 * Token de injeção de dependência para o repositório de formas de pagamento
 */
export const PAYMENT_TYPE_REPOSITORY = Symbol('PAYMENT_TYPE_REPOSITORY');

/**
 * Contrato para repositório de formas de pagamento
 * Define as operações de persistência que a camada de infraestrutura deve implementar
 */
export interface PaymentTypeRepositoryContract {
  /**
   * Lista formas de pagamento com paginação e busca opcional
   */
  list(params: ListPaymentTypesParams): Promise<Result<PaginatedPaymentTypes>>;

  /**
   * Cria uma nova forma de pagamento
   */
  create(params: CreatePaymentTypeParams): Promise<Result<PaymentTypeData>>;

  /**
   * Atualiza uma forma de pagamento existente
   */
  update(id: string, params: UpdatePaymentTypeParams): Promise<Result<PaymentTypeData>>;

  /**
   * Remove uma forma de pagamento
   */
  remove(id: string): Promise<Result<void>>;
}
