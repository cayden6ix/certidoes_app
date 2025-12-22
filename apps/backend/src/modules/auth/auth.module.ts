import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './3-interface-adapters/web-controllers/auth.controller';
import { JwtAuthGuard } from './3-interface-adapters/guards/jwt-auth.guard';
import { RolesGuard } from './3-interface-adapters/guards/roles.guard';
import { authProviders } from './4-infrastructure/di/auth.providers';

/**
 * Módulo de autenticação
 * Gerencia login, logout, refresh token e autorização
 */
@Module({
  imports: [ConfigModule, SharedModule],
  controllers: [AuthController],
  providers: [...authProviders, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, ...authProviders],
})
export class AuthModule {}
