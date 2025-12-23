import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import type { PaymentType } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type { Tables, TablesInsert, TablesUpdate } from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListPaymentTypesParams {
  search?: string;
  limit: number;
  offset: number;
}

interface CreatePaymentTypeParams {
  name: string;
  enabled?: boolean;
}

interface UpdatePaymentTypeParams {
  name?: string;
  enabled?: boolean;
}

@Injectable()
export class PaymentTypesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(params: ListPaymentTypesParams): Promise<{ data: PaymentType[]; total: number }> {
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
      throw new BadRequestException('Não foi possível listar as formas de pagamento');
    }

    const rows = (data ?? []) as Tables<'payment_type'>[];

    return {
      data: rows.map((row) => this.mapPaymentType(row)),
      total: count ?? 0,
    };
  }

  async create(params: CreatePaymentTypeParams): Promise<PaymentType> {
    const insertData: TablesInsert<'payment_type'> = {
      name: params.name,
      // Alguns ambientes usam "active" em vez de "enabled"
      enabled: params.enabled ?? undefined,
      // fallback para coluna "active"
      ...(params.enabled !== undefined ? { active: params.enabled } : {}),
      created_at: new Date().toISOString(),
    };

    // Tenta inserir usando enabled/active; se falhar por coluna ausente, tenta novamente só com name
    let data: Tables<'payment_type'> | null = null;
    let errorMessage: string | undefined;

    const firstAttempt = await this.supabase
      .from('payment_type')
      .insert(insertData)
      .select('*')
      .single();

    if (firstAttempt.data) {
      data = firstAttempt.data as Tables<'payment_type'>;
    } else if (firstAttempt.error) {
      errorMessage = firstAttempt.error.message;
      const normalized = firstAttempt.error.message.toLowerCase();
      const columnMissing =
        normalized.includes('could not find the') || normalized.includes('column') || normalized.includes('schema cache');

      if (columnMissing) {
        const fallbackAttempt = await this.supabase
          .from('payment_type')
          .insert({ name: params.name, created_at: new Date().toISOString() })
          .select('*')
          .single();

        if (fallbackAttempt.data) {
          data = fallbackAttempt.data as Tables<'payment_type'>;
          errorMessage = undefined;
        } else if (fallbackAttempt.error) {
          errorMessage = fallbackAttempt.error.message;
        }
      }
    }

    if (!data) {
      this.logger.error('Erro ao criar forma de pagamento', { error: errorMessage });
      throw new BadRequestException('Não foi possível criar a forma de pagamento');
    }

    return this.mapPaymentType(data);
  }

  async update(id: string, params: UpdatePaymentTypeParams): Promise<PaymentType> {
    const updateData: TablesUpdate<'payment_type'> = {};

    if (params.name !== undefined) updateData.name = params.name;
    if (params.enabled !== undefined) {
      updateData.enabled = params.enabled;
      // fallback para colunas "active"
      (updateData as Record<string, unknown>).active = params.enabled;
    }

    const { data, error } = await this.supabase
      .from('payment_type')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao atualizar forma de pagamento', { error: error?.message, id });
      throw new BadRequestException('Não foi possível atualizar a forma de pagamento');
    }

    return this.mapPaymentType(data as Tables<'payment_type'>);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('payment_type').delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover forma de pagamento', { error: error.message, id });
      throw new BadRequestException('Não foi possível remover a forma de pagamento');
    }
  }

  private mapPaymentType(row: Tables<'payment_type'>): PaymentType {
    const booleanRow = row as Record<string, unknown>;

    return {
      id: row.id,
      name: row.name,
      description: (row as Record<string, string | null>).description ?? null,
      enabled:
        (booleanRow.enabled as boolean | null | undefined) ??
        (booleanRow.active as boolean | null | undefined) ??
        true,
      createdAt: row.created_at,
    };
  }
}
