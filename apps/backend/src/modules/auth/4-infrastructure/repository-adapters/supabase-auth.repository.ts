import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';
import { AuthUserEntity } from '../../1-domain/entities/auth-user.entity';
import { UserRoleValueObject } from '../../1-domain/value-objects/user-role.value-object';

/**
 * Interface para tipagem da linha de profile do banco
 */
interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'admin';
  created_at: string;
}

/**
 * Implementação de repositório de autenticação com Supabase
 * Usa serviceRoleKey para bypass de RLS (controle de permissões no backend)
 */
export class SupabaseAuthRepository implements AuthRepositoryContract {
  /**
   * Cliente Supabase com serviceRoleKey (acesso administrativo)
   */
  private supabaseClient: SupabaseClient;

  constructor(
    supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.supabaseClient = supabaseClient;

    this.logger.debug('Repositório de autenticação Supabase inicializado');
  }

  /**
   * Autentica usuário com email e senha
   * @param email - Email do usuário
   * @param password - Senha em texto plano
   * @returns Result com AuthUserEntity ou erro
   */
  async login(email: string, password: string): Promise<Result<AuthUserEntity>> {
    try {
      // Valida entrada básica
      if (!email || !password) {
        return failure(AuthError.INVALID_CREDENTIALS);
      }

      // Faz login com Supabase Auth
      const { data: authData, error: authError } =
        await this.supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        this.logger.warn('Falha no login Supabase', {
          email,
          error: authError?.message,
        });

        return failure(AuthError.INVALID_CREDENTIALS);
      }

      const userId = authData.user.id;
      const session = authData.session;

      if (!session) {
        this.logger.warn('Session não retornada após login', { userId });
        return failure(AuthError.AUTHENTICATION_SERVICE_ERROR);
      }

      // Busca profile do usuário
      const { data: profileData, error: profileError } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single<ProfileRow>();

      if (profileError || !profileData) {
        this.logger.warn('Profile não encontrado após login', {
          userId,
          error: profileError?.message,
        });

        return failure(AuthError.PROFILE_NOT_FOUND);
      }

      // Mapeia para entidade de domínio
      const authUser = this.mapToAuthUserEntity(session, profileData);

      if (!authUser) {
        return failure(AuthError.AUTHENTICATION_SERVICE_ERROR);
      }

      this.logger.info('Login bem-sucedido', {
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role.getValue(),
      });

      return success(authUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro crítico durante login', {
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }

  /**
   * Faz logout do usuário
   * Para JWT stateless, apenas registra auditoria
   * @param token - Token JWT (não utilizado em JWT stateless)
   * @returns Result<void>
   */
  async logout(token: string): Promise<Result<void>> {
    try {
      // Em JWT stateless, o token é removido no cliente
      // Backend apenas registra auditoria
      if (!token) {
        this.logger.warn('Logout chamado sem token');
        return success(undefined as never);
      }

      this.logger.info('Logout registrado', {
        tokenPrefix: token.substring(0, 4),
      });

      return success(undefined as never);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro durante logout', {
        error: errorMessage,
      });

      // Logout sempre retorna sucesso
      return success(undefined as never);
    }
  }

  /**
   * Obtém usuário autenticado pelo token
   * @param token - Token JWT
   * @returns Result com AuthUserEntity ou erro
   */
  async getCurrentUser(token: string): Promise<Result<AuthUserEntity>> {
    try {
      if (!token) {
        return failure(AuthError.TOKEN_MISSING);
      }

      // Valida token com Supabase
      const { data: userData, error: userError } =
        await this.supabaseClient.auth.getUser(token);

      if (userError || !userData.user) {
        this.logger.warn('Token inválido ou expirado', {
          error: userError?.message,
        });

        return failure(AuthError.TOKEN_INVALID);
      }

      const userId = userData.user.id;

      // Busca profile completo
      const { data: profileData, error: profileError } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single<ProfileRow>();

      if (profileError || !profileData) {
        this.logger.warn('Profile não encontrado para usuário autenticado', {
          userId,
          error: profileError?.message,
        });

        return failure(AuthError.PROFILE_NOT_FOUND);
      }

      // Mapeia para entidade
      const authUser = this.mapToAuthUserEntityFromProfile(profileData);

      if (!authUser) {
        return failure(AuthError.AUTHENTICATION_SERVICE_ERROR);
      }

      this.logger.debug('Usuário atual obtido com sucesso', {
        userId: authUser.id,
        role: authUser.role.getValue(),
      });

      return success(authUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao obter usuário atual', {
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }

  /**
   * Obtém dados de um usuário pelo ID
   * @param userId - ID do usuário
   * @returns Result com AuthUserEntity ou erro
   */
  async getUserById(userId: string): Promise<Result<AuthUserEntity>> {
    try {
      if (!userId) {
        this.logger.warn('Tentativa de obter usuário sem ID');
        return failure(AuthError.USER_NOT_FOUND);
      }

      const { data: profileData, error: profileError } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single<ProfileRow>();

      if (profileError || !profileData) {
        this.logger.warn('Profile não encontrado para usuário', {
          userId,
          error: profileError?.message,
        });

        return failure(AuthError.PROFILE_NOT_FOUND);
      }

      const authUser = this.mapToAuthUserEntityFromProfile(profileData);

      if (!authUser) {
        return failure(AuthError.AUTHENTICATION_SERVICE_ERROR);
      }

      return success(authUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao obter usuário por ID', {
        userId,
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }

  /**
   * Mapeia sessão e profile para AuthUserEntity
   * @param session - Sessão retornada pelo Supabase Auth
   * @param profile - Dados do profile do usuário
   * @returns AuthUserEntity ou null se houver erro
   */
  private mapToAuthUserEntity(session: any, profile: ProfileRow): AuthUserEntity | null {
    try {
      // Cria value object de role
      const roleResult = UserRoleValueObject.create(profile.role);

      if (!roleResult.success) {
        this.logger.error('Role inválida do banco de dados', {
          role: profile.role,
          userId: profile.id,
        });

        return null;
      }

      // Cria entidade com tokens da sessão
      return AuthUserEntity.create({
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: roleResult.data,
        createdAt: new Date(profile.created_at),
        accessToken: session?.access_token || '',
        refreshToken: session?.refresh_token,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao mapear usuario para entidade', {
        error: errorMessage,
        userId: profile.id,
      });

      return null;
    }
  }

  /**
   * Mapeia profile para AuthUserEntity (sem session)
   * Usado para getCurrentUser que não retorna tokens
   * @param profile - Dados do profile
   * @returns AuthUserEntity ou null
   */
  private mapToAuthUserEntityFromProfile(profile: ProfileRow): AuthUserEntity | null {
    try {
      // Cria value object de role
      const roleResult = UserRoleValueObject.create(profile.role);

      if (!roleResult.success) {
        this.logger.error('Role inválida do banco de dados', {
          role: profile.role,
          userId: profile.id,
        });

        return null;
      }

      // Cria entidade sem tokens (getCurrentUser não retorna tokens)
      return AuthUserEntity.create({
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: roleResult.data,
        createdAt: new Date(profile.created_at),
        accessToken: '', // Vazio para getCurrentUser
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao mapear usuario para entidade', {
        error: errorMessage,
        userId: profile.id,
      });

      return null;
    }
  }
}
