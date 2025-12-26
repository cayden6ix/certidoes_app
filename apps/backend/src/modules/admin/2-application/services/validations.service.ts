import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import type { ValidationConfig } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListValidationParams {
  search?: string;
  includeInactive?: boolean;
  limit: number;
  offset: number;
}

interface CreateValidationParams {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateValidationParams {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class ValidationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(params: ListValidationParams): Promise<{ data: ValidationConfig[]; total: number }> {
    const searchValue = params.search?.trim();

    let query = this.supabase
      .from('validations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (!params.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (searchValue) {
      const normalized = `%${searchValue}%`;
      query = query.or(`name.ilike.${normalized},description.ilike.${normalized}`);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Erro ao listar validações', { error: error.message });
      throw new BadRequestException('Não foi possível listar as validações');
    }

    const rows = (data ?? []) as Tables<'validations'>[];

    return {
      data: rows.map((row) => this.mapValidation(row)),
      total: count ?? 0,
    };
  }

  async findByName(name: string): Promise<ValidationConfig | null> {
    const { data, error } = await this.supabase
      .from('validations')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) {
      this.logger.error('Erro ao buscar validação por nome', { error: error.message, name });
      throw new BadRequestException('Não foi possível buscar a validação');
    }

    if (!data) {
      return null;
    }

    return this.mapValidation(data as Tables<'validations'>);
  }

  async create(params: CreateValidationParams): Promise<ValidationConfig> {
    const existing = await this.findByName(params.name);
    if (existing) {
      throw new BadRequestException(`Já existe uma validação com o nome "${params.name}"`);
    }

    const insertData: TablesInsert<'validations'> = {
      name: params.name,
      description: params.description ?? null,
      is_active: params.isActive ?? true,
    };

    const { data, error } = await this.supabase
      .from('validations')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao criar validação', { error: error?.message });
      throw new BadRequestException('Não foi possível criar a validação');
    }

    return this.mapValidation(data as Tables<'validations'>);
  }

  async update(id: string, params: UpdateValidationParams): Promise<ValidationConfig> {
    const updateData: TablesUpdate<'validations'> = {};

    if (params.name !== undefined) updateData.name = params.name;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.isActive !== undefined) updateData.is_active = params.isActive;

    const { data, error } = await this.supabase
      .from('validations')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao atualizar validação', { error: error?.message, id });
      throw new BadRequestException('Não foi possível atualizar a validação');
    }

    return this.mapValidation(data as Tables<'validations'>);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('validations').delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover validação', { error: error.message, id });
      throw new BadRequestException('Não foi possível remover a validação');
    }
  }

  private mapValidation(row: Tables<'validations'>): ValidationConfig {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
