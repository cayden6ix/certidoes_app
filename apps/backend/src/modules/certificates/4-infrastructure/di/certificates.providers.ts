import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import { CreateCertificateUseCase } from '../../2-application/use-cases/create-certificate.usecase';
import { ListCertificatesUseCase } from '../../2-application/use-cases/list-certificates.usecase';
import { GetCertificateUseCase } from '../../2-application/use-cases/get-certificate.usecase';
import { UpdateCertificateUseCase } from '../../2-application/use-cases/update-certificate.usecase';
import { SupabaseCertificateRepository } from '../repository-adapters/supabase-certificate.repository';
import {
  CERTIFICATE_REPOSITORY_CONTRACT,
  CREATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATES_USECASE,
  GET_CERTIFICATE_USECASE,
  UPDATE_CERTIFICATE_USECASE,
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
      configService: ConfigService,
      logger: LoggerContract,
    ): CertificateRepositoryContract => {
      return new SupabaseCertificateRepository(configService, logger);
    },
    inject: [ConfigService, LOGGER_CONTRACT],
  },

  // ============ USE CASES ============

  {
    provide: CREATE_CERTIFICATE_USECASE,
    useFactory: (
      certificateRepository: CertificateRepositoryContract,
      logger: LoggerContract,
    ): CreateCertificateUseCase => {
      return new CreateCertificateUseCase(certificateRepository, logger);
    },
    inject: [CERTIFICATE_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
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
      logger: LoggerContract,
    ): UpdateCertificateUseCase => {
      return new UpdateCertificateUseCase(certificateRepository, logger);
    },
    inject: [CERTIFICATE_REPOSITORY_CONTRACT, LOGGER_CONTRACT],
  },
];
