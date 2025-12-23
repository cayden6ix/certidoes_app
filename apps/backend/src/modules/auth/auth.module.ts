import { Module } from '@nestjs/common';
import { AuthController } from './3-interface-adapters/web-controllers/auth.controller';
import { authProviders } from './4-infrastructure/di/auth.providers';
import { SupabaseModule } from '../supabase/supabase.module';
import {
  AUTH_REPOSITORY_CONTRACT,
  TOKEN_SERVICE_CONTRACT,
  LOGIN_USECASE,
  LOGOUT_USECASE,
  GET_CURRENT_USER_USECASE,
  GET_USER_PROFILE_USECASE,
} from './4-infrastructure/di/auth.tokens';

/**
 * Módulo de autenticação
 * Implementa autenticação com Supabase Auth
 * Fornece guards, decorators e use cases para proteger rotas
 */
@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [...authProviders],
  exports: [
    AUTH_REPOSITORY_CONTRACT,
    TOKEN_SERVICE_CONTRACT,
    LOGIN_USECASE,
    LOGOUT_USECASE,
    GET_CURRENT_USER_USECASE,
    GET_USER_PROFILE_USECASE,
  ],
})
export class AuthModule {}
