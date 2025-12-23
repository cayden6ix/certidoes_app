import type { Provider } from '@nestjs/common';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateEventRepositoryContract } from '../../1-domain/contracts/certificate-event.repository.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import { CreateCertificateUseCase } from '../../2-application/use-cases/create-certificate.usecase';
import { ListCertificatesUseCase } from '../../2-application/use-cases/list-certificates.usecase';
import { GetCertificateUseCase } from '../../2-application/use-cases/get-certificate.usecase';
import { UpdateCertificateUseCase } from '../../2-application/use-cases/update-certificate.usecase';
import { ListCertificateEventsUseCase } from '../../2-application/use-cases/list-certificate-events.usecase';
import { SupabaseCertificateEventRepository } from '../repository-adapters/supabase-certificate-event.repository';
import { SupabaseCertificateRepository } from '../repository-adapters/supabase-certificate.repository';
import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import {
  CERTIFICATE_EVENT_REPOSITORY_CONTRACT,
  CERTIFICATE_REPOSITORY_CONTRACT,
  CREATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATES_USECASE,
  GET_CERTIFICATE_USECASE,
  UPDATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATE_EVENTS_USECASE,
} from './certificates.tokens';

/**
 * Array de providers para o módulo de certidões
 * Define como as dependências devem ser criadas e injetadas
 * Usa factory functions em vez de decorators para manter Clean Architecture
 */
export const certificatesProviders: Provider[] = [
  // ============ REPOSITORY ============

  {
    provide: CERTIFICATE_REPOSITORY_CONTRACT,
    useFactory: (
      supabaseClient: TypedSupabaseClient,
      logger: LoggerContract,
    ): CertificateRepositoryContract => {
      return new SupabaseCertificateRepository(supabaseClient, logger);
    },
    inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
  },
  {
    provide: CERTIFICATE_EVENT_REPOSITORY_CONTRACT,
    useFactory: (
      supabaseClient: TypedSupabaseClient,
      logger: LoggerContract,
    ): CertificateEventRepositoryContract => {
      return new SupabaseCertificateEventRepository(supabaseClient, logger);
    },
    inject: [SUPABASE_CLIENT, LOGGER_CONTRACT],
  },

  // ============ USE CASES ============

  {
    provide: CREATE_CERTIFICATE_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      certificateEventRepository: CertificateEventRepositoryContract,
      logger: LoggerContract,
    ): CreateCertificateUseCase => {
      return new CreateCertificateUseCase(
        certificateRepository,
        certificateEventRepository,
        logger,
      );
    },
    inject: [
      CERTIFICATE_REPOSITORY_CONTRACT,
      CERTIFICATE_EVENT_REPOSITORY_CONTRACT,
      LOGGER_CONTRACT,
    ],
  },

  {
    provide: LIST_CERTIFICATES_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      logger: LoggerContract,
    ): ListCertificatesUseCase => {
      return new ListCertificatesUseCase(certificateRepository, logger);
    },
    inject: [CERTIFICATE_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },

  {
    provide: GET_CERTIFICATE_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      logger: LoggerContract,
    ): GetCertificateUseCase => {
      return new GetCertificateUseCase(certificateRepository, logger);
    },
    inject: [CERTIFICATE_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },

  {
    provide: UPDATE_CERTIFICATE_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      certificateEventRepository: CertificateEventRepositoryContract,
      logger: LoggerContract,
    ): UpdateCertificateUseCase => {
      return new UpdateCertificateUseCase(
        certificateRepository,
        certificateEventRepository,
        logger,
      );
    },
    inject: [
      CERTIFICATE_REPOSITORY_CONTRACT,
      CERTIFICATE_EVENT_REPOSITORY_CONTRACT,
      LOGGER_CONTRACT,
    ],
  },
  {
    provide: LIST_CERTIFICATE_EVENTS_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      certificateEventRepository: CertificateEventRepositoryContract,
      logger: LoggerContract,
    ): ListCertificateEventsUseCase => {
      return new ListCertificateEventsUseCase(
        certificateRepository,
        certificateEventRepository,
        logger,
      );
    },
    inject: [
      CERTIFICATE_REPOSITORY_CONTRACT,
      CERTIFICATE_EVENT_REPOSITORY_CONTRACT,
      LOGGER_CONTRACT,
    ],
  },
];
