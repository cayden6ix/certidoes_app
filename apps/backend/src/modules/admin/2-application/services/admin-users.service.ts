import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { AuthUser, User as SupabaseUser } from '@supabase/supabase-js';
import type { AdminUser } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesUpdate,
  UserRole,
} from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListUsersParams {
  search?: string;
  limit: number;
  offset: number;
}

interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

interface UpdateUserParams {
  email?: string;
  fullName?: string;
  role?: UserRole;
  password?: string;
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(params: ListUsersParams): Promise<{ data: AdminUser[]; total: number }> {
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
      throw new BadRequestException('Não foi possível listar usuários');
    }

    const rows = (data ?? []) as Tables<'profiles'>[];

    return {
      data: rows.map((row) => this.mapProfile(row)),
      total: count ?? 0,
    };
  }

  async create(params: CreateUserParams): Promise<AdminUser> {
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
        status: (error as { status?: number })?.status,
        name: error?.name,
        email: params.email,
      });

      const normalizedMessage = error?.message?.toLowerCase() ?? '';
      const maybeDuplicate =
        normalizedMessage.includes('already registered') || normalizedMessage.includes('exists');

      // Fallback: verifica se já existe usuário com o mesmo email no Auth
      const existing = await this.findUserByEmail(params.email);
      if (existing) {
        const profile = await this.upsertProfile(existing, params);
        return this.mapProfile(profile);
      }

      // Se for erro genérico de base, tenta novamente com payload mínimo (sem metadata)
      const maybeDbError =
        normalizedMessage.includes('database error creating new user') ||
        normalizedMessage.includes('database error');

      if (maybeDbError) {
        const minimal = await this.supabase.auth.admin.createUser({
          email: params.email,
          password: params.password,
          email_confirm: true,
        });

        if (minimal.data?.user) {
          const profile = await this.upsertProfile(minimal.data.user, params);
          return this.mapProfile(profile);
        }

        this.logger.error('Fallback createUser também falhou', {
          error: minimal.error?.message,
          email: params.email,
        });
      }

      const userFriendly = maybeDuplicate
        ? 'Usuário já existe ou email em uso (verifique auth.users no Supabase)'
        : (error?.message ?? 'Não foi possível criar o usuário');

      throw new BadRequestException(userFriendly);
    }

    const user = data.user;

    const profile = await this.upsertProfile(user, params);

    return this.mapProfile(profile);
  }

  async update(id: string, params: UpdateUserParams): Promise<AdminUser> {
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
        throw new BadRequestException('Não foi possível atualizar o usuário');
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
      throw new BadRequestException('Não foi possível atualizar o usuário');
    }

    return this.mapProfile(data as Tables<'profiles'>);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(id);

    if (error) {
      this.logger.error('Erro ao remover usuário', { error: error.message, userId: id });

      if (error.message?.includes('not authorized')) {
        throw new UnauthorizedException('Permissão insuficiente para remover usuário');
      }

      throw new BadRequestException('Não foi possível remover o usuário');
    }
  }

  private async upsertProfile(
    user: AuthUser,
    params: CreateUserParams,
  ): Promise<Tables<'profiles'>> {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: params.email,
          full_name: params.fullName,
          role: params.role,
        },
        {
          onConflict: 'id',
        },
      )
      .select('*')
      .single();

    if (profileError || !profile) {
      this.logger.error('Erro ao criar/atualizar profile', {
        error: profileError?.message,
        userId: user.id,
      });
      throw new BadRequestException('Usuário criado, mas perfil não pôde ser salvo');
    }

    return profile as Tables<'profiles'>;
  }

  private mapProfile(row: Tables<'profiles'>): AdminUser {
    if (!row) {
      throw new NotFoundException('Perfil não encontrado');
    }

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Busca usuário de autenticação por email varrendo a lista (fallback quando create falha)
   */
  private async findUserByEmail(email: string): Promise<SupabaseUser | null> {
    const target = email.trim().toLowerCase();
    let page = 1;
    const perPage = 100;

    // Percorre páginas até encontrar ou acabar (adequado para bases pequenas)
    // Em bases grandes, considere otimizar com RPC.
    // O Supabase retorna empty quando não há mais páginas.

    while (true) {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        this.logger.warn('Falha ao listar usuários ao buscar por email', {
          error: error.message,
          page,
        });
        return null;
      }

      const users = data?.users ?? [];
      const found = users.find((u) => u.email && u.email.toLowerCase() === target);

      if (found) {
        return found;
      }

      if (!data || users.length < perPage) {
        return null;
      }

      page += 1;
    }
  }
}
