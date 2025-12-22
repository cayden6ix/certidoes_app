import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { AuthRepositoryContract } from '../../1-domain/contracts/auth.repository.contract';
import type { TokenServiceContract } from '../../1-domain/contracts/token.service.contract';
import { LoginUseCase } from '../../2-application/use-cases/login.usecase';
import { LogoutUseCase } from '../../2-application/use-cases/logout.usecase';
import { GetCurrentUserUseCase } from '../../2-application/use-cases/get-current-user.usecase';
import { SupabaseAuthRepository } from '../repository-adapters/supabase-auth.repository';
import { SupabaseTokenService } from '../services/supabase-token.service';
import {
  AUTH_REPOSITORY_CONTRACT,
  TOKEN_SERVICE_CONTRACT,
  LOGIN_USECASE,
  LOGOUT_USECASE,
  GET_CURRENT_USER_USECASE,
} from './auth.tokens';

/**
 * Array de providers para o módulo de autenticação
 * Define como as dependências devem ser criadas e injetadas
 * Usa factory functions em vez de decorators para manter Clean Architecture
 */
export const authProviders: Provider[] = [
  // ============ REPOSITORY ============

  {
    provide: AUTH_REPOSITORY_CONTRACT,
    useFactory: (
      configService: ConfigService,
      logger: LoggerContract,
    ): AuthRepositoryContract => {
      return new SupabaseAuthRepository(configService, logger);
    },
    inject: [ConfigService, LOGGER_CONTRACT],
  },

  // ============ SERVICES ============

  {
    provide: TOKEN_SERVICE_CONTRACT,
    useFactory: (
      configService: ConfigService,
      logger: LoggerContract,
    ): TokenServiceContract => {
      return new SupabaseTokenService(configService, logger);
    },
    inject: [ConfigService, LOGGER_CONTRACT],
  },

  // ============ USE CASES ============

  {
    provide: LOGIN_USECASE,
    useFactory: (
      authRepository: AuthRepositoryContract,
      logger: LoggerContract,
    ): LoginUseCase => {
      return new LoginUseCase(authRepository, logger);
    },
    inject: [AUTH_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },

  {
    provide: LOGOUT_USECASE,
    useFactory: (
      authRepository: AuthRepositoryContract,
      logger: LoggerContract,
    ): LogoutUseCase => {
      return new LogoutUseCase(authRepository, logger);
    },
    inject: [AUTH_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },

  {
    provide: GET_CURRENT_USER_USECASE,
    useFactory: (
      authRepository: AuthRepositoryContract,
      logger: LoggerContract,
    ): GetCurrentUserUseCase => {
      return new GetCurrentUserUseCase(authRepository, logger);
    },
    inject: [AUTH_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },
];
