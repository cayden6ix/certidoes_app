import type { AuthUser } from '@supabase/supabase-js';

import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type { Tables, TablesUpdate } from '../../../supabase/1-domain/types/database.types';
import type {
  AdminUserRepositoryContract,
  AdminUserData,
  ListAdminUsersParams,
  PaginatedAdminUsers,
  CreateAdminUserParams,
  UpdateAdminUserParams,
} from '../../1-domain/contracts/admin-user.repository.contract';

/**
 * Erros específicos do repositório de usuários admin
 */
export const AdminUserRepositoryError = {
  LIST_FAILED: 'Não foi possível listar usuários',
  USER_NOT_FOUND: 'Usuário não encontrado',
  CREATE_FAILED: 'Não foi possível criar o usuário',
  USER_ALREADY_EXISTS: 'Usuário já existe ou email em uso',
  UPDATE_FAILED: 'Não foi possível atualizar o usuário',
  REMOVE_FAILED: 'Não foi possível remover o usuário',
  REMOVE_UNAUTHORIZED: 'Permissão insuficiente para remover usuário',
  PROFILE_SAVE_FAILED: 'Usuário criado, mas perfil não pôde ser salvo',
} as const;

/**
 * Implementação do repositório de usuários admin usando Supabase
 */
export class SupabaseAdminUserRepository implements AdminUserRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListAdminUsersParams): Promise<Result<PaginatedAdminUsers>> {
    try {
      const searchValue = params.search?.trim();

      let query = this.supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (searchValue) {
        const normalized = `%${searchValue}%`;
        query = query.or(`full_name.ilike.${normalized},email.ilike.${normalized}`);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar usuários', { error: error.message });
        return failure(AdminUserRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as Tables<'profiles'>[];

      return success({
        data: rows.map((row) => this.mapProfile(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar usuários', { error: errorMessage });
      return failure(AdminUserRepositoryError.LIST_FAILED);
    }
  }

  async findById(id: string): Promise<Result<AdminUserData>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return failure(AdminUserRepositoryError.USER_NOT_FOUND);
      }

      return success(this.mapProfile(data as Tables<'profiles'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar usuário', { error: errorMessage, id });
      return failure(AdminUserRepositoryError.USER_NOT_FOUND);
    }
  }

  async create(params: CreateAdminUserParams): Promise<Result<AdminUserData>> {
    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: {
          full_name: params.fullName,
          role: params.role,
        },
      });

      if (error || !data?.user) {
        this.logger.error('Erro ao criar usuário no Supabase Auth', {
          error: error?.message,
          email: params.email,
        });

        const normalizedMessage = error?.message?.toLowerCase() ?? '';
        const isDuplicate =
          normalizedMessage.includes('already registered') || normalizedMessage.includes('exists');

        if (isDuplicate) {
          return failure(AdminUserRepositoryError.USER_ALREADY_EXISTS);
        }

        return failure(AdminUserRepositoryError.CREATE_FAILED);
      }

      const profileResult = await this.upsertProfile(data.user, params);

      if (!profileResult.success) {
        return failure(profileResult.error);
      }

      return success(this.mapProfile(profileResult.data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar usuário', { error: errorMessage });
      return failure(AdminUserRepositoryError.CREATE_FAILED);
    }
  }

  async update(id: string, params: UpdateAdminUserParams): Promise<Result<AdminUserData>> {
    try {
      // Atualiza dados sensíveis no Auth (email/senha)
      if (params.email || params.password) {
        const { error: updateAuthError } = await this.supabase.auth.admin.updateUserById(id, {
          email: params.email,
          password: params.password,
        });

        if (updateAuthError) {
          this.logger.error('Erro ao atualizar usuário no Supabase Auth', {
            error: updateAuthError.message,
            userId: id,
          });
          return failure(AdminUserRepositoryError.UPDATE_FAILED);
        }
      }

      const updateData: TablesUpdate<'profiles'> = {};

      if (params.fullName !== undefined) {
        updateData.full_name = params.fullName;
      }
      if (params.email !== undefined) {
        updateData.email = params.email;
      }
      if (params.role !== undefined) {
        updateData.role = params.role;
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao atualizar perfil', { error: error?.message, userId: id });
        return failure(AdminUserRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapProfile(data as Tables<'profiles'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar usuário', { error: errorMessage, id });
      return failure(AdminUserRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.auth.admin.deleteUser(id);

      if (error) {
        this.logger.error('Erro ao remover usuário', { error: error.message, userId: id });

        if (error.message?.includes('not authorized')) {
          return failure(AdminUserRepositoryError.REMOVE_UNAUTHORIZED);
        }

        return failure(AdminUserRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover usuário', { error: errorMessage, id });
      return failure(AdminUserRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Cria ou atualiza o perfil do usuário na tabela profiles
   */
  private async upsertProfile(
    user: AuthUser,
    params: CreateAdminUserParams,
  ): Promise<Result<Tables<'profiles'>>> {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: params.email,
          full_name: params.fullName,
          role: params.role,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single();

    if (profileError || !profile) {
      this.logger.error('Erro ao criar/atualizar profile', {
        error: profileError?.message,
        userId: user.id,
      });
      return failure(AdminUserRepositoryError.PROFILE_SAVE_FAILED);
    }

    return success(profile as Tables<'profiles'>);
  }

  /**
   * Mapeia uma linha do banco para o tipo AdminUserData
   */
  private mapProfile(row: Tables<'profiles'>): AdminUserData {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
