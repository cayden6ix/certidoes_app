import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PinoLoggerService } from '../../../../shared/4-infrastructure/logger/pino-logger.service';
import {
  AuthenticateUserUseCase,
  LogoutUserUseCase,
  RefreshTokenUseCase,
} from '../../2-application';
import { AuthUserSupabaseRepository } from '../repository-adapters/auth-user-supabase.repository';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { AUTH_TOKENS } from './auth.tokens';

/**
 * Factory para criar cliente Supabase
 */
export const createSupabaseClient = (configService: ConfigService): SupabaseClient => {
  const supabaseUrl = configService.get<string>('supabase.url');
  const supabaseKey = configService.get<string>('supabase.serviceRoleKey');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuração do Supabase não encontrada');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Factory para criar AuthenticateUserUseCase
 */
export const createAuthenticateUserUseCase = (
  authService: SupabaseAuthService,
  userRepository: AuthUserSupabaseRepository,
  logger: PinoLoggerService,
): AuthenticateUserUseCase => {
  return new AuthenticateUserUseCase(authService, userRepository, logger);
};

/**
 * Factory para criar RefreshTokenUseCase
 */
export const createRefreshTokenUseCase = (
  authService: SupabaseAuthService,
  logger: PinoLoggerService,
): RefreshTokenUseCase => {
  return new RefreshTokenUseCase(authService, logger);
};

/**
 * Factory para criar LogoutUserUseCase
 */
export const createLogoutUserUseCase = (
  authService: SupabaseAuthService,
  logger: PinoLoggerService,
): LogoutUserUseCase => {
  return new LogoutUserUseCase(authService, logger);
};

/**
 * Providers do módulo Auth
 */
export const authProviders = [
  // Supabase Client
  {
    provide: AUTH_TOKENS.SUPABASE_CLIENT,
    useFactory: createSupabaseClient,
    inject: [ConfigService],
  },

  // Logger
  {
    provide: AUTH_TOKENS.LOGGER,
    useExisting: PinoLoggerService,
  },

  // Services
  {
    provide: AUTH_TOKENS.AUTH_SERVICE,
    useClass: SupabaseAuthService,
  },

  // Repositories
  {
    provide: AUTH_TOKENS.AUTH_USER_REPOSITORY,
    useClass: AuthUserSupabaseRepository,
  },

  // Use Cases
  {
    provide: AUTH_TOKENS.AUTHENTICATE_USER_USECASE,
    useFactory: createAuthenticateUserUseCase,
    inject: [AUTH_TOKENS.AUTH_SERVICE, AUTH_TOKENS.AUTH_USER_REPOSITORY, AUTH_TOKENS.LOGGER],
  },
  {
    provide: AUTH_TOKENS.REFRESH_TOKEN_USECASE,
    useFactory: createRefreshTokenUseCase,
    inject: [AUTH_TOKENS.AUTH_SERVICE, AUTH_TOKENS.LOGGER],
  },
  {
    provide: AUTH_TOKENS.LOGOUT_USER_USECASE,
    useFactory: createLogoutUserUseCase,
    inject: [AUTH_TOKENS.AUTH_SERVICE, AUTH_TOKENS.LOGGER],
  },
];
