import { Module } from '@nestjs/common';
import { CertificatesController } from './3-interface-adapters/web-controllers/certificates.controller';
import { certificatesProviders } from './4-infrastructure/di/certificates.providers';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';

/**
 * Módulo de certidões
 * Implementa CRUD de certidões com controle de acesso por role
 * Depende do AuthModule para autenticação e autorização
 * Importa AdminModule para acesso ao repositorio de tags (bulk update)
 */
@Module({
  imports: [AuthModule, SupabaseModule, AdminModule],
  controllers: [CertificatesController],
  providers: [...certificatesProviders],
  exports: [],
})
export class CertificatesModule {}
