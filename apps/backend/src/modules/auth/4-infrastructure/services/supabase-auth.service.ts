import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import {
  AuthenticationResult,
  AuthServiceContract,
  RefreshResult,
} from '../../1-domain/contracts/auth.service.contract';
import { AUTH_TOKENS } from '../di/auth.tokens';

/**
 * Implementação do serviço de autenticação usando Supabase
 */
@Injectable()
export class SupabaseAuthService implements AuthServiceContract {
  constructor(
    @Inject(AUTH_TOKENS.SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    @Inject(AUTH_TOKENS.LOGGER)
    private readonly logger: LoggerContract,
  ) {}

  async signInWithPassword(email: string, password: string): Promise<AuthenticationResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.warn('Erro ao autenticar com Supabase', {
          context: 'SupabaseAuthService',
          error: error.message,
        });
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      if (!data.session || !data.user) {
        this.logger.error('Supabase retornou dados incompletos', {
          context: 'SupabaseAuthService',
          hasSession: !!data.session,
          hasUser: !!data.user,
        });
        throw new UnauthorizedException('Erro ao autenticar');
      }

      // Buscar role do usuário na tabela profiles
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        this.logger.error('Erro ao buscar perfil do usuário', {
          context: 'SupabaseAuthService',
          userId: data.user.id,
          error: profileError.message,
        });
        throw new Error('Perfil de usuário não encontrado');
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          fullName: profile.full_name,
          role: profile.role,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erro inesperado ao autenticar', {
        context: 'SupabaseAuthService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw new UnauthorizedException('Erro ao autenticar');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        this.logger.warn('Erro ao renovar token com Supabase', {
          context: 'SupabaseAuthService',
          error: error.message,
        });
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      if (!data.session) {
        this.logger.error('Supabase retornou sessão vazia ao renovar token', {
          context: 'SupabaseAuthService',
        });
        throw new UnauthorizedException('Erro ao renovar token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erro inesperado ao renovar token', {
        context: 'SupabaseAuthService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw new UnauthorizedException('Erro ao renovar token');
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.warn('Erro ao verificar token com Supabase', {
          context: 'SupabaseAuthService',
          error: error.message,
        });
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      if (!data.user) {
        this.logger.warn('Usuário não encontrado ao verificar token', {
          context: 'SupabaseAuthService',
        });
        throw new UnauthorizedException('Token inválido');
      }

      // Buscar role do usuário
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        this.logger.error('Erro ao buscar role do usuário', {
          context: 'SupabaseAuthService',
          userId: data.user.id,
          error: profileError.message,
        });
        throw new UnauthorizedException('Perfil não encontrado');
      }

      return {
        userId: data.user.id,
        email: data.user.email!,
        role: profile.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erro inesperado ao verificar token', {
        context: 'SupabaseAuthService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw new UnauthorizedException('Token inválido');
    }
  }

  async signOut(accessToken: string): Promise<void> {
    try {
      // Configurar o cliente Supabase com o token do usuário
      const { error } = await this.supabase.auth.admin.signOut(accessToken);

      if (error) {
        this.logger.warn('Erro ao realizar logout com Supabase', {
          context: 'SupabaseAuthService',
          error: error.message,
        });
        // Não lançamos exceção pois logout é best-effort
      }
    } catch (error) {
      this.logger.error('Erro inesperado ao realizar logout', {
        context: 'SupabaseAuthService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      // Não lançamos exceção pois logout é best-effort
    }
  }
}
