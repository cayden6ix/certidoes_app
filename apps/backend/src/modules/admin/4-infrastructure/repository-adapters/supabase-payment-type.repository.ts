import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import type {
  PaymentTypeRepositoryContract,
  PaymentTypeData,
  ListPaymentTypesParams,
  PaginatedPaymentTypes,
  CreatePaymentTypeParams,
  UpdatePaymentTypeParams,
} from '../../1-domain/contracts/payment-type.repository.contract';

/**
 * Erros específicos do repositório de formas de pagamento
 */
export const PaymentTypeRepositoryError = {
  LIST_FAILED: 'Não foi possível listar as formas de pagamento',
  CREATE_FAILED: 'Não foi possível criar a forma de pagamento',
  UPDATE_FAILED: 'Não foi possível atualizar a forma de pagamento',
  REMOVE_FAILED: 'Não foi possível remover a forma de pagamento',
} as const;

/**
 * Implementação do repositório de formas de pagamento usando Supabase
 */
export class SupabasePaymentTypeRepository implements PaymentTypeRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListPaymentTypesParams): Promise<Result<PaginatedPaymentTypes>> {
    try {
      const searchValue = params.search?.trim();

      let query = this.supabase
        .from('payment_type')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (searchValue) {
        query = query.ilike('name', `%${searchValue}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar formas de pagamento', { error: error.message });
        return failure(PaymentTypeRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as Tables<'payment_type'>[];

      return success({
        data: rows.map((row) => this.mapPaymentType(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar formas de pagamento', { error: errorMessage });
      return failure(PaymentTypeRepositoryError.LIST_FAILED);
    }
  }

  async create(params: CreatePaymentTypeParams): Promise<Result<PaymentTypeData>> {
    try {
      const insertData: TablesInsert<'payment_type'> = {
        name: params.name,
        enabled: params.enabled ?? true,
      };

      const { data, error } = await this.supabase
        .from('payment_type')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao criar forma de pagamento', { error: error?.message });
        return failure(PaymentTypeRepositoryError.CREATE_FAILED);
      }

      return success(this.mapPaymentType(data as Tables<'payment_type'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar forma de pagamento', { error: errorMessage });
      return failure(PaymentTypeRepositoryError.CREATE_FAILED);
    }
  }

  async update(id: string, params: UpdatePaymentTypeParams): Promise<Result<PaymentTypeData>> {
    try {
      const updateData: TablesUpdate<'payment_type'> = {};

      if (params.name !== undefined) updateData.name = params.name;
      if (params.enabled !== undefined) updateData.enabled = params.enabled;

      const { data, error } = await this.supabase
        .from('payment_type')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao atualizar forma de pagamento', { error: error?.message, id });
        return failure(PaymentTypeRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapPaymentType(data as Tables<'payment_type'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar forma de pagamento', {
        error: errorMessage,
        id,
      });
      return failure(PaymentTypeRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.from('payment_type').delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao remover forma de pagamento', { error: error.message, id });
        return failure(PaymentTypeRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover forma de pagamento', { error: errorMessage, id });
      return failure(PaymentTypeRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo PaymentTypeData
   */
  private mapPaymentType(row: Tables<'payment_type'>): PaymentTypeData {
    return {
      id: row.id,
      name: row.name,
      description: (row as Record<string, string | null>).description ?? null,
      enabled: row.enabled ?? true,
      createdAt: row.created_at,
    };
  }
}
