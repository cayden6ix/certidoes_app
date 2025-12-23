import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';
import type {
  TokenServiceContract,
  TokenPayload,
} from '../../1-domain/contracts/token.service.contract';

/**
 * Implementação de serviço de tokens com Supabase
 * Responsável por validar JWT e extrair informações do token
 */
export class SupabaseTokenService implements TokenServiceContract {
  /**
   * Cliente Supabase com serviceRoleKey
   */
  private supabaseClient: SupabaseClient;

  constructor(
    supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.supabaseClient = supabaseClient;

    this.logger.debug('Serviço de tokens Supabase inicializado');
  }

  /**
   * Valida um token JWT e retorna seu payload decodificado
   * @param token - Token JWT a validar
   * @returns Result com TokenPayload ou erro
   */
  async validateToken(token: string): Promise<Result<TokenPayload>> {
    try {
      if (!token) {
        return failure(AuthError.TOKEN_MISSING);
      }

      // Valida token com Supabase
      const { data: userData, error: userError } =
        await this.supabaseClient.auth.getUser(token);

      if (userError || !userData.user) {
        this.logger.warn('Validação de token falhou', {
          error: userError?.message,
        });

        return failure(AuthError.TOKEN_INVALID);
      }

      // Busca role do usuário para retornar no payload
      const { data: profileData, error: profileError } = await this.supabaseClient
        .from('profiles')
        .select('role, email')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profileData) {
        this.logger.warn('Profile não encontrado para token válido', {
          userId: userData.user.id,
          error: profileError?.message,
        });

        return failure(AuthError.PROFILE_NOT_FOUND);
      }

      const tokenPayload: TokenPayload = {
        userId: userData.user.id,
        role: (profileData as any).role,
        email: (profileData as any).email,
      };

      this.logger.debug('Token validado com sucesso', {
        userId: tokenPayload.userId,
        role: tokenPayload.role,
      });

      return success(tokenPayload);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao validar token', {
        error: errorMessage,
      });

      return failure(AuthError.AUTHENTICATION_SERVICE_ERROR, { error });
    }
  }

  /**
   * Extrai o token JWT do header Authorization
   * Espera formato: "Bearer <token>"
   * @param authHeader - Valor do header Authorization
   * @returns Result com token extraído ou erro
   */
  extractTokenFromHeader(authHeader: string): Result<string> {
    try {
      if (!authHeader) {
        return failure(AuthError.TOKEN_MISSING);
      }

      const parts = authHeader.split(' ');

      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        this.logger.warn('Formato de header Authorization inválido');
        return failure(AuthError.TOKEN_INVALID);
      }

      const token = parts[1];

      if (!token) {
        return failure(AuthError.TOKEN_MISSING);
      }

      return success(token);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao extrair token do header', {
        error: errorMessage,
      });

      return failure(AuthError.TOKEN_INVALID);
    }
  }
}
