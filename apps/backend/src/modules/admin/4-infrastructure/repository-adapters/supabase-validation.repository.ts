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
  ValidationRepositoryContract,
  ValidationData,
  ListValidationsParams,
  PaginatedValidations,
  CreateValidationParams,
  UpdateValidationParams,
} from '../../1-domain/contracts/validation.repository.contract';

/**
 * Erros específicos do repositório de validações
 */
export const ValidationRepositoryError = {
  LIST_FAILED: 'Não foi possível listar as validações',
  FIND_FAILED: 'Não foi possível buscar a validação',
  CREATE_FAILED: 'Não foi possível criar a validação',
  VALIDATION_ALREADY_EXISTS: 'Já existe uma validação com este nome',
  UPDATE_FAILED: 'Não foi possível atualizar a validação',
  REMOVE_FAILED: 'Não foi possível remover a validação',
} as const;

/**
 * Implementação do repositório de validações usando Supabase
 */
export class SupabaseValidationRepository implements ValidationRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListValidationsParams): Promise<Result<PaginatedValidations>> {
    try {
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
        return failure(ValidationRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as Tables<'validations'>[];

      return success({
        data: rows.map((row) => this.mapValidation(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar validações', { error: errorMessage });
      return failure(ValidationRepositoryError.LIST_FAILED);
    }
  }

  async findByName(name: string): Promise<Result<ValidationData | null>> {
    try {
      const { data, error } = await this.supabase
        .from('validations')
        .select('*')
        .eq('name', name)
        .maybeSingle();

      if (error) {
        this.logger.error('Erro ao buscar validação por nome', { error: error.message, name });
        return failure(ValidationRepositoryError.FIND_FAILED);
      }

      if (!data) {
        return success(null);
      }

      return success(this.mapValidation(data as Tables<'validations'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar validação', { error: errorMessage, name });
      return failure(ValidationRepositoryError.FIND_FAILED);
    }
  }

  async create(params: CreateValidationParams): Promise<Result<ValidationData>> {
    try {
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
        return failure(ValidationRepositoryError.CREATE_FAILED);
      }

      return success(this.mapValidation(data as Tables<'validations'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar validação', { error: errorMessage });
      return failure(ValidationRepositoryError.CREATE_FAILED);
    }
  }

  async update(id: string, params: UpdateValidationParams): Promise<Result<ValidationData>> {
    try {
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
        return failure(ValidationRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapValidation(data as Tables<'validations'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar validação', { error: errorMessage, id });
      return failure(ValidationRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.from('validations').delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao remover validação', { error: error.message, id });
        return failure(ValidationRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover validação', { error: errorMessage, id });
      return failure(ValidationRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo ValidationData
   */
  private mapValidation(row: Tables<'validations'>): ValidationData {
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
