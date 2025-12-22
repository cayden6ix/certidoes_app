import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthUserRepositoryContract } from '../../1-domain/contracts/auth-user.repository.contract';
import { AuthUserEntity } from '../../1-domain/entities/auth-user.entity';
import { AUTH_TOKENS } from '../di/auth.tokens';

/**
 * Implementação do repositório de usuários usando Supabase
 */
@Injectable()
export class AuthUserSupabaseRepository implements AuthUserRepositoryContract {
  constructor(
    @Inject(AUTH_TOKENS.SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    @Inject(AUTH_TOKENS.LOGGER)
    private readonly logger: LoggerContract,
  ) {}

  async findById(id: string): Promise<AuthUserEntity | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado
          return null;
        }
        this.logger.error('Erro ao buscar usuário por ID', {
          context: 'AuthUserSupabaseRepository',
          userId: id,
          error: error.message,
        });
        throw new Error('Erro ao buscar usuário');
      }

      if (!data) {
        return null;
      }

      return new AuthUserEntity(
        data.id,
        data.email,
        data.full_name,
        data.role,
        new Date(data.created_at),
        new Date(data.updated_at),
      );
    } catch (error) {
      this.logger.error('Erro inesperado ao buscar usuário por ID', {
        context: 'AuthUserSupabaseRepository',
        userId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<AuthUserEntity | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado
          return null;
        }
        this.logger.error('Erro ao buscar usuário por email', {
          context: 'AuthUserSupabaseRepository',
          error: error.message,
        });
        throw new Error('Erro ao buscar usuário');
      }

      if (!data) {
        return null;
      }

      return new AuthUserEntity(
        data.id,
        data.email,
        data.full_name,
        data.role,
        new Date(data.created_at),
        new Date(data.updated_at),
      );
    } catch (error) {
      this.logger.error('Erro inesperado ao buscar usuário por email', {
        context: 'AuthUserSupabaseRepository',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }

  async create(user: AuthUserEntity): Promise<AuthUserEntity> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Erro ao criar usuário', {
          context: 'AuthUserSupabaseRepository',
          error: error.message,
        });
        throw new Error('Erro ao criar usuário');
      }

      return new AuthUserEntity(
        data.id,
        data.email,
        data.full_name,
        data.role,
        new Date(data.created_at),
        new Date(data.updated_at),
      );
    } catch (error) {
      this.logger.error('Erro inesperado ao criar usuário', {
        context: 'AuthUserSupabaseRepository',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }

  async update(user: AuthUserEntity): Promise<AuthUserEntity> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        this.logger.error('Erro ao atualizar usuário', {
          context: 'AuthUserSupabaseRepository',
          userId: user.id,
          error: error.message,
        });
        throw new Error('Erro ao atualizar usuário');
      }

      return new AuthUserEntity(
        data.id,
        data.email,
        data.full_name,
        data.role,
        new Date(data.created_at),
        new Date(data.updated_at),
      );
    } catch (error) {
      this.logger.error('Erro inesperado ao atualizar usuário', {
        context: 'AuthUserSupabaseRepository',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }
}
