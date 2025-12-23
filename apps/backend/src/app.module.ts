import { Module } from '@nestjs/common';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { SharedModule } from './shared/shared.module';
import { AdminModule } from './modules/admin/admin.module';

/**
 * Módulo raiz da aplicação
 * Importa todos os módulos de funcionalidade
 */
@Module({
  imports: [SharedModule, HealthModule, AuthModule, CertificatesModule, AdminModule],
})
export class AppModule {}
