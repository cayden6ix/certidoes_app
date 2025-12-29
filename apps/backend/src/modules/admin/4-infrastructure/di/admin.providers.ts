import type { Provider } from '@nestjs/common';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

import { ADMIN_USER_REPOSITORY } from '../../1-domain/contracts/admin-user.repository.contract';
import { VALIDATION_REPOSITORY } from '../../1-domain/contracts/validation.repository.contract';
import { PAYMENT_TYPE_REPOSITORY } from '../../1-domain/contracts/payment-type.repository.contract';
import { CERTIFICATE_TYPE_REPOSITORY } from '../../1-domain/contracts/certificate-type.repository.contract';
import { CERTIFICATE_STATUS_REPOSITORY } from '../../1-domain/contracts/certificate-status.repository.contract';
import { CERTIFICATE_STATUS_VALIDATION_REPOSITORY } from '../../1-domain/contracts/certificate-status-validation.repository.contract';
import { CERTIFICATE_TAG_REPOSITORY } from '../../1-domain/contracts/certificate-tag.repository.contract';
import { SupabaseAdminUserRepository } from '../repository-adapters/supabase-admin-user.repository';
import { SupabaseValidationRepository } from '../repository-adapters/supabase-validation.repository';
import { SupabasePaymentTypeRepository } from '../repository-adapters/supabase-payment-type.repository';
import { SupabaseCertificateTypeRepository } from '../repository-adapters/supabase-certificate-type.repository';
import { SupabaseCertificateStatusRepository } from '../repository-adapters/supabase-certificate-status.repository';
import { SupabaseCertificateStatusValidationRepository } from '../repository-adapters/supabase-certificate-status-validation.repository';
import { SupabaseCertificateTagRepository } from '../repository-adapters/supabase-certificate-tag.repository';
import { SupabaseCertificateEventRepository } from '../repository-adapters/supabase-certificate-event.repository';

import {
  ListAdminUsersUseCase,
  CreateAdminUserUseCase,
  UpdateAdminUserUseCase,
  RemoveAdminUserUseCase,
} from '../../2-application/use-cases';

import {
  ListValidationsUseCase,
  CreateValidationUseCase,
  UpdateValidationUseCase,
  RemoveValidationUseCase,
} from '../../2-application/use-cases/validations';

import {
  ListPaymentTypesUseCase,
  CreatePaymentTypeUseCase,
  UpdatePaymentTypeUseCase,
  RemovePaymentTypeUseCase,
} from '../../2-application/use-cases/payment-types';

import {
  ListCertificateTypesUseCase,
  CreateCertificateTypeUseCase,
  UpdateCertificateTypeUseCase,
  RemoveCertificateTypeUseCase,
} from '../../2-application/use-cases/certificate-types';

import {
  ListCertificateStatusUseCase,
  FindCertificateStatusByIdUseCase,
  FindCertificateStatusByNameUseCase,
  CreateCertificateStatusUseCase,
  UpdateCertificateStatusUseCase,
  RemoveCertificateStatusUseCase,
} from '../../2-application/use-cases/certificate-status';

import {
  ListStatusValidationsUseCase,
  CreateStatusValidationUseCase,
  UpdateStatusValidationUseCase,
  RemoveStatusValidationUseCase,
} from '../../2-application/use-cases/certificate-status-validations';

import {
  ListTagsUseCase,
  CreateTagUseCase,
  UpdateTagUseCase,
  RemoveTagUseCase,
  AssignTagUseCase,
  UnassignTagUseCase,
  UpdateCertificateTagsUseCase,
  CERTIFICATE_EVENT_REPOSITORY,
} from '../../2-application/use-cases/certificate-tags';

import {
  LIST_ADMIN_USERS_USECASE,
  CREATE_ADMIN_USER_USECASE,
  UPDATE_ADMIN_USER_USECASE,
  REMOVE_ADMIN_USER_USECASE,
  LIST_VALIDATIONS_USECASE,
  CREATE_VALIDATION_USECASE,
  UPDATE_VALIDATION_USECASE,
  REMOVE_VALIDATION_USECASE,
  LIST_PAYMENT_TYPES_USECASE,
  CREATE_PAYMENT_TYPE_USECASE,
  UPDATE_PAYMENT_TYPE_USECASE,
  REMOVE_PAYMENT_TYPE_USECASE,
  LIST_CERTIFICATE_TYPES_USECASE,
  CREATE_CERTIFICATE_TYPE_USECASE,
  UPDATE_CERTIFICATE_TYPE_USECASE,
  REMOVE_CERTIFICATE_TYPE_USECASE,
  LIST_CERTIFICATE_STATUS_USECASE,
  FIND_CERTIFICATE_STATUS_BY_ID_USECASE,
  FIND_CERTIFICATE_STATUS_BY_NAME_USECASE,
  CREATE_CERTIFICATE_STATUS_USECASE,
  UPDATE_CERTIFICATE_STATUS_USECASE,
  REMOVE_CERTIFICATE_STATUS_USECASE,
  LIST_STATUS_VALIDATIONS_USECASE,
  CREATE_STATUS_VALIDATION_USECASE,
  UPDATE_STATUS_VALIDATION_USECASE,
  REMOVE_STATUS_VALIDATION_USECASE,
  LIST_TAGS_USECASE,
  CREATE_TAG_USECASE,
  UPDATE_TAG_USECASE,
  REMOVE_TAG_USECASE,
  ASSIGN_TAG_USECASE,
  UNASSIGN_TAG_USECASE,
  UPDATE_CERTIFICATE_TAGS_USECASE,
} from './admin.tokens';

/**
 * Provider do repositório de usuários admin
 */
export const adminUserRepositoryProvider: Provider = {
  provide: ADMIN_USER_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseAdminUserRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de usuários
 */
export const listAdminUsersUseCaseProvider: Provider = {
  provide: LIST_ADMIN_USERS_USECASE,
  useFactory: (repository: SupabaseAdminUserRepository, logger: LoggerContract) => {
    return new ListAdminUsersUseCase(repository, logger);
  },
  inject: [ADMIN_USER_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de usuários
 */
export const createAdminUserUseCaseProvider: Provider = {
  provide: CREATE_ADMIN_USER_USECASE,
  useFactory: (repository: SupabaseAdminUserRepository, logger: LoggerContract) => {
    return new CreateAdminUserUseCase(repository, logger);
  },
  inject: [ADMIN_USER_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de usuários
 */
export const updateAdminUserUseCaseProvider: Provider = {
  provide: UPDATE_ADMIN_USER_USECASE,
  useFactory: (repository: SupabaseAdminUserRepository, logger: LoggerContract) => {
    return new UpdateAdminUserUseCase(repository, logger);
  },
  inject: [ADMIN_USER_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de usuários
 */
export const removeAdminUserUseCaseProvider: Provider = {
  provide: REMOVE_ADMIN_USER_USECASE,
  useFactory: (repository: SupabaseAdminUserRepository, logger: LoggerContract) => {
    return new RemoveAdminUserUseCase(repository, logger);
  },
  inject: [ADMIN_USER_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para usuários
 */
export const adminUserProviders: Provider[] = [
  adminUserRepositoryProvider,
  listAdminUsersUseCaseProvider,
  createAdminUserUseCaseProvider,
  updateAdminUserUseCaseProvider,
  removeAdminUserUseCaseProvider,
];

// ============================================================
// VALIDATIONS
// ============================================================

/**
 * Provider do repositório de validações
 */
export const validationRepositoryProvider: Provider = {
  provide: VALIDATION_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseValidationRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de validações
 */
export const listValidationsUseCaseProvider: Provider = {
  provide: LIST_VALIDATIONS_USECASE,
  useFactory: (repository: SupabaseValidationRepository, logger: LoggerContract) => {
    return new ListValidationsUseCase(repository, logger);
  },
  inject: [VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de validação
 */
export const createValidationUseCaseProvider: Provider = {
  provide: CREATE_VALIDATION_USECASE,
  useFactory: (repository: SupabaseValidationRepository, logger: LoggerContract) => {
    return new CreateValidationUseCase(repository, logger);
  },
  inject: [VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de validação
 */
export const updateValidationUseCaseProvider: Provider = {
  provide: UPDATE_VALIDATION_USECASE,
  useFactory: (repository: SupabaseValidationRepository, logger: LoggerContract) => {
    return new UpdateValidationUseCase(repository, logger);
  },
  inject: [VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de validação
 */
export const removeValidationUseCaseProvider: Provider = {
  provide: REMOVE_VALIDATION_USECASE,
  useFactory: (repository: SupabaseValidationRepository, logger: LoggerContract) => {
    return new RemoveValidationUseCase(repository, logger);
  },
  inject: [VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para validações
 */
export const validationProviders: Provider[] = [
  validationRepositoryProvider,
  listValidationsUseCaseProvider,
  createValidationUseCaseProvider,
  updateValidationUseCaseProvider,
  removeValidationUseCaseProvider,
];

// ============================================================
// PAYMENT TYPES
// ============================================================

/**
 * Provider do repositório de formas de pagamento
 */
export const paymentTypeRepositoryProvider: Provider = {
  provide: PAYMENT_TYPE_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabasePaymentTypeRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de formas de pagamento
 */
export const listPaymentTypesUseCaseProvider: Provider = {
  provide: LIST_PAYMENT_TYPES_USECASE,
  useFactory: (repository: SupabasePaymentTypeRepository, logger: LoggerContract) => {
    return new ListPaymentTypesUseCase(repository, logger);
  },
  inject: [PAYMENT_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de forma de pagamento
 */
export const createPaymentTypeUseCaseProvider: Provider = {
  provide: CREATE_PAYMENT_TYPE_USECASE,
  useFactory: (repository: SupabasePaymentTypeRepository, logger: LoggerContract) => {
    return new CreatePaymentTypeUseCase(repository, logger);
  },
  inject: [PAYMENT_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de forma de pagamento
 */
export const updatePaymentTypeUseCaseProvider: Provider = {
  provide: UPDATE_PAYMENT_TYPE_USECASE,
  useFactory: (repository: SupabasePaymentTypeRepository, logger: LoggerContract) => {
    return new UpdatePaymentTypeUseCase(repository, logger);
  },
  inject: [PAYMENT_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de forma de pagamento
 */
export const removePaymentTypeUseCaseProvider: Provider = {
  provide: REMOVE_PAYMENT_TYPE_USECASE,
  useFactory: (repository: SupabasePaymentTypeRepository, logger: LoggerContract) => {
    return new RemovePaymentTypeUseCase(repository, logger);
  },
  inject: [PAYMENT_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para formas de pagamento
 */
export const paymentTypeProviders: Provider[] = [
  paymentTypeRepositoryProvider,
  listPaymentTypesUseCaseProvider,
  createPaymentTypeUseCaseProvider,
  updatePaymentTypeUseCaseProvider,
  removePaymentTypeUseCaseProvider,
];

// ============================================================
// CERTIFICATE TYPES
// ============================================================

/**
 * Provider do repositório de tipos de certidão
 */
export const certificateTypeRepositoryProvider: Provider = {
  provide: CERTIFICATE_TYPE_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseCertificateTypeRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de tipos de certidão
 */
export const listCertificateTypesUseCaseProvider: Provider = {
  provide: LIST_CERTIFICATE_TYPES_USECASE,
  useFactory: (repository: SupabaseCertificateTypeRepository, logger: LoggerContract) => {
    return new ListCertificateTypesUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de tipo de certidão
 */
export const createCertificateTypeUseCaseProvider: Provider = {
  provide: CREATE_CERTIFICATE_TYPE_USECASE,
  useFactory: (repository: SupabaseCertificateTypeRepository, logger: LoggerContract) => {
    return new CreateCertificateTypeUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de tipo de certidão
 */
export const updateCertificateTypeUseCaseProvider: Provider = {
  provide: UPDATE_CERTIFICATE_TYPE_USECASE,
  useFactory: (repository: SupabaseCertificateTypeRepository, logger: LoggerContract) => {
    return new UpdateCertificateTypeUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de tipo de certidão
 */
export const removeCertificateTypeUseCaseProvider: Provider = {
  provide: REMOVE_CERTIFICATE_TYPE_USECASE,
  useFactory: (repository: SupabaseCertificateTypeRepository, logger: LoggerContract) => {
    return new RemoveCertificateTypeUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TYPE_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para tipos de certidão
 */
export const certificateTypeProviders: Provider[] = [
  certificateTypeRepositoryProvider,
  listCertificateTypesUseCaseProvider,
  createCertificateTypeUseCaseProvider,
  updateCertificateTypeUseCaseProvider,
  removeCertificateTypeUseCaseProvider,
];

// ============================================================
// CERTIFICATE STATUS
// ============================================================

/**
 * Provider do repositório de status de certidão
 */
export const certificateStatusRepositoryProvider: Provider = {
  provide: CERTIFICATE_STATUS_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseCertificateStatusRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de status de certidão
 */
export const listCertificateStatusUseCaseProvider: Provider = {
  provide: LIST_CERTIFICATE_STATUS_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new ListCertificateStatusUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de busca de status por ID
 */
export const findCertificateStatusByIdUseCaseProvider: Provider = {
  provide: FIND_CERTIFICATE_STATUS_BY_ID_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new FindCertificateStatusByIdUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de busca de status por nome
 */
export const findCertificateStatusByNameUseCaseProvider: Provider = {
  provide: FIND_CERTIFICATE_STATUS_BY_NAME_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new FindCertificateStatusByNameUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de status de certidão
 */
export const createCertificateStatusUseCaseProvider: Provider = {
  provide: CREATE_CERTIFICATE_STATUS_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new CreateCertificateStatusUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de status de certidão
 */
export const updateCertificateStatusUseCaseProvider: Provider = {
  provide: UPDATE_CERTIFICATE_STATUS_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new UpdateCertificateStatusUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de status de certidão
 */
export const removeCertificateStatusUseCaseProvider: Provider = {
  provide: REMOVE_CERTIFICATE_STATUS_USECASE,
  useFactory: (repository: SupabaseCertificateStatusRepository, logger: LoggerContract) => {
    return new RemoveCertificateStatusUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para status de certidão
 */
export const certificateStatusProviders: Provider[] = [
  certificateStatusRepositoryProvider,
  listCertificateStatusUseCaseProvider,
  findCertificateStatusByIdUseCaseProvider,
  findCertificateStatusByNameUseCaseProvider,
  createCertificateStatusUseCaseProvider,
  updateCertificateStatusUseCaseProvider,
  removeCertificateStatusUseCaseProvider,
];

// ============================================================
// CERTIFICATE STATUS VALIDATIONS
// ============================================================

/**
 * Provider do repositório de validações por status
 */
export const certificateStatusValidationRepositoryProvider: Provider = {
  provide: CERTIFICATE_STATUS_VALIDATION_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseCertificateStatusValidationRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de validações por status
 */
export const listStatusValidationsUseCaseProvider: Provider = {
  provide: LIST_STATUS_VALIDATIONS_USECASE,
  useFactory: (
    repository: SupabaseCertificateStatusValidationRepository,
    logger: LoggerContract,
  ) => {
    return new ListStatusValidationsUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de validação por status
 */
export const createStatusValidationUseCaseProvider: Provider = {
  provide: CREATE_STATUS_VALIDATION_USECASE,
  useFactory: (
    repository: SupabaseCertificateStatusValidationRepository,
    logger: LoggerContract,
  ) => {
    return new CreateStatusValidationUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de validação por status
 */
export const updateStatusValidationUseCaseProvider: Provider = {
  provide: UPDATE_STATUS_VALIDATION_USECASE,
  useFactory: (
    repository: SupabaseCertificateStatusValidationRepository,
    logger: LoggerContract,
  ) => {
    return new UpdateStatusValidationUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de validação por status
 */
export const removeStatusValidationUseCaseProvider: Provider = {
  provide: REMOVE_STATUS_VALIDATION_USECASE,
  useFactory: (
    repository: SupabaseCertificateStatusValidationRepository,
    logger: LoggerContract,
  ) => {
    return new RemoveStatusValidationUseCase(repository, logger);
  },
  inject: [CERTIFICATE_STATUS_VALIDATION_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para validações por status
 */
export const certificateStatusValidationProviders: Provider[] = [
  certificateStatusValidationRepositoryProvider,
  listStatusValidationsUseCaseProvider,
  createStatusValidationUseCaseProvider,
  updateStatusValidationUseCaseProvider,
  removeStatusValidationUseCaseProvider,
];

// ============================================================
// CERTIFICATE TAGS
// ============================================================

/**
 * Provider do repositório de tags de certidão
 */
export const certificateTagRepositoryProvider: Provider = {
  provide: CERTIFICATE_TAG_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseCertificateTagRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do repositório de eventos de certificado (para auditoria)
 */
export const certificateEventRepositoryProvider: Provider = {
  provide: CERTIFICATE_EVENT_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseCertificateEventRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de tags
 */
export const listTagsUseCaseProvider: Provider = {
  provide: LIST_TAGS_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new ListTagsUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de criação de tag
 */
export const createTagUseCaseProvider: Provider = {
  provide: CREATE_TAG_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new CreateTagUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de tag
 */
export const updateTagUseCaseProvider: Provider = {
  provide: UPDATE_TAG_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new UpdateTagUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de remoção de tag
 */
export const removeTagUseCaseProvider: Provider = {
  provide: REMOVE_TAG_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new RemoveTagUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de associação de tag a certificado
 */
export const assignTagUseCaseProvider: Provider = {
  provide: ASSIGN_TAG_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new AssignTagUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de desassociação de tag de certificado
 */
export const unassignTagUseCaseProvider: Provider = {
  provide: UNASSIGN_TAG_USECASE,
  useFactory: (repository: SupabaseCertificateTagRepository, logger: LoggerContract) => {
    return new UnassignTagUseCase(repository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de atualização de tags de um certificado
 */
export const updateCertificateTagsUseCaseProvider: Provider = {
  provide: UPDATE_CERTIFICATE_TAGS_USECASE,
  useFactory: (
    tagRepository: SupabaseCertificateTagRepository,
    eventRepository: SupabaseCertificateEventRepository,
    logger: LoggerContract,
  ) => {
    return new UpdateCertificateTagsUseCase(tagRepository, eventRepository, logger);
  },
  inject: [CERTIFICATE_TAG_REPOSITORY, CERTIFICATE_EVENT_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para tags de certidão
 */
export const certificateTagProviders: Provider[] = [
  certificateTagRepositoryProvider,
  certificateEventRepositoryProvider,
  listTagsUseCaseProvider,
  createTagUseCaseProvider,
  updateTagUseCaseProvider,
  removeTagUseCaseProvider,
  assignTagUseCaseProvider,
  unassignTagUseCaseProvider,
  updateCertificateTagsUseCaseProvider,
];

// ============================================================
// REPORTS
// ============================================================

import { REPORT_REPOSITORY } from '../../1-domain/contracts/report.repository.contract';
import { SupabaseReportRepository } from '../repository-adapters/supabase-report.repository';
import {
  GetReportMetricsUseCase,
  GetReportCertificatesUseCase,
} from '../../2-application/use-cases/reports';
import { GET_REPORT_METRICS_USECASE, GET_REPORT_CERTIFICATES_USECASE } from './admin.tokens';

/**
 * Provider do repositório de relatórios
 */
export const reportRepositoryProvider: Provider = {
  provide: REPORT_REPOSITORY,
  useFactory: (supabase: TypedSupabaseClient, logger: LoggerContract) => {
    return new SupabaseReportRepository(supabase, logger);
  },
  inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
};

/**
 * Provider do use case de métricas do relatório
 */
export const getReportMetricsUseCaseProvider: Provider = {
  provide: GET_REPORT_METRICS_USECASE,
  useFactory: (repository: SupabaseReportRepository, logger: LoggerContract) => {
    return new GetReportMetricsUseCase(repository, logger);
  },
  inject: [REPORT_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Provider do use case de listagem de certidões do relatório
 */
export const getReportCertificatesUseCaseProvider: Provider = {
  provide: GET_REPORT_CERTIFICATES_USECASE,
  useFactory: (repository: SupabaseReportRepository, logger: LoggerContract) => {
    return new GetReportCertificatesUseCase(repository, logger);
  },
  inject: [REPORT_REPOSITORY, LOGGER_CONTRACT],
};

/**
 * Todos os providers do módulo admin para relatórios
 */
export const reportProviders: Provider[] = [
  reportRepositoryProvider,
  getReportMetricsUseCaseProvider,
  getReportCertificatesUseCaseProvider,
];
