import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminUsersController } from './3-interface-adapters/web-controllers/admin-users.controller';
import { PaymentTypesController } from './3-interface-adapters/web-controllers/payment-types.controller';
import { CertificateTypesController } from './3-interface-adapters/web-controllers/certificate-types.controller';
import { CertificateTagsController } from './3-interface-adapters/web-controllers/certificate-tags.controller';
import { CertificateStatusController } from './3-interface-adapters/web-controllers/certificate-status.controller';
import { CertificateStatusValidationsController } from './3-interface-adapters/web-controllers/certificate-status-validations.controller';
import { ValidationsController } from './3-interface-adapters/web-controllers/validations.controller';
import { AdminUsersService } from './2-application/services/admin-users.service';
import { PaymentTypesService } from './2-application/services/payment-types.service';
import { CertificateTypesService } from './2-application/services/certificate-types.service';
import { CertificateTagsService } from './2-application/services/certificate-tags.service';
import { CertificateStatusService } from './2-application/services/certificate-status.service';
import { CertificateStatusValidationsService } from './2-application/services/certificate-status-validations.service';
import { ValidationsService } from './2-application/services/validations.service';

/**
 * Módulo administrativo
 * Centraliza os recursos de gestão para admins (usuários, pagamentos, tipos, tags e status)
 */
@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [
    AdminUsersController,
    PaymentTypesController,
    CertificateTypesController,
    CertificateTagsController,
    CertificateStatusController,
    ValidationsController,
    CertificateStatusValidationsController,
  ],
  providers: [
    AdminUsersService,
    PaymentTypesService,
    CertificateTypesService,
    CertificateTagsService,
    CertificateStatusService,
    ValidationsService,
    CertificateStatusValidationsService,
  ],
  exports: [CertificateStatusService],
})
export class AdminModule {}
