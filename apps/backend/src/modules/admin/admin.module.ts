import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';

// Controllers
import { AdminUsersController } from './3-interface-adapters/web-controllers/admin-users.controller';
import { PaymentTypesController } from './3-interface-adapters/web-controllers/payment-types.controller';
import { CertificateTypesController } from './3-interface-adapters/web-controllers/certificate-types.controller';
import { CertificateTagsController } from './3-interface-adapters/web-controllers/certificate-tags.controller';
import { CertificateStatusController } from './3-interface-adapters/web-controllers/certificate-status.controller';
import { CertificateStatusValidationsController } from './3-interface-adapters/web-controllers/certificate-status-validations.controller';
import { ValidationsController } from './3-interface-adapters/web-controllers/validations.controller';
import { ReportsController } from './3-interface-adapters/web-controllers/reports.controller';

// Providers refatorados (Clean Architecture)
import {
  adminUserProviders,
  validationProviders,
  paymentTypeProviders,
  certificateTypeProviders,
  certificateStatusProviders,
  certificateStatusValidationProviders,
  certificateTagProviders,
  reportProviders,
} from './4-infrastructure/di/admin.providers';
import { CERTIFICATE_TAG_REPOSITORY } from './1-domain/contracts/certificate-tag.repository.contract';

/**
 * Módulo administrativo
 * Centraliza os recursos de gestão para admins (usuários, pagamentos, tipos, tags e status)
 *
 * Arquitetura: Todos os services foram refatorados seguindo Clean Architecture
 * - AdminUsers: domain/application/infrastructure
 * - Validations: domain/application/infrastructure
 * - PaymentTypes: domain/application/infrastructure
 * - CertificateTypes: domain/application/infrastructure
 * - CertificateStatus: domain/application/infrastructure
 * - CertificateStatusValidations: domain/application/infrastructure
 * - CertificateTags: domain/application/infrastructure
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
    ReportsController,
  ],
  providers: [
    ...adminUserProviders,
    ...validationProviders,
    ...paymentTypeProviders,
    ...certificateTypeProviders,
    ...certificateStatusProviders,
    ...certificateStatusValidationProviders,
    ...certificateTagProviders,
    ...reportProviders,
  ],
  exports: [CERTIFICATE_TAG_REPOSITORY],
})
export class AdminModule {}
