// Entities
export { CertificateEntity } from './entities/certificate.entity';
export type { CertificateEntityProps } from './entities/certificate.entity';
export { CertificateEventEntity } from './entities/certificate-event.entity';
export type { CertificateEventEntityProps } from './entities/certificate-event.entity';

// Value Objects
export { CertificateStatusValueObject } from './value-objects/certificate-status.value-object';
export type { CertificateStatusData } from './value-objects/certificate-status.value-object';
export { CertificatePriorityValueObject } from './value-objects/certificate-priority.value-object';
export type { CertificatePriorityType } from './value-objects/certificate-priority.value-object';

// Contracts
export type {
  CertificateRepositoryContract,
  CreateCertificateData,
  UpdateCertificateData,
  ListCertificatesOptions,
  PaginatedCertificates,
} from './contracts/certificate.repository.contract';
export type {
  CertificateEventRepositoryContract,
  CreateCertificateEventData,
} from './contracts/certificate-event.repository.contract';
export type {
  CertificateStatusValidationContract,
  StatusValidationRequirement,
} from './contracts/certificate-status-validation.contract';

// Services
export { CertificateAccessControlService } from './services/certificate-access-control.service';
export type {
  ClientAllowedFields,
  AdminAllowedFields,
  AccessCheckResult,
} from './services/certificate-access-control.service';

export { CertificateChangeTrackingService } from './services/certificate-change-tracking.service';
export type {
  CertificateSnapshot,
  FieldChange,
  ChangeMap,
  CertificateEventType,
} from './services/certificate-change-tracking.service';

export { CertificateStatusValidationService } from './services/certificate-status-validation.service';
export type {
  UserValidationData,
  StatusValidationResult,
} from './services/certificate-status-validation.service';

// Errors
export { CertificateError } from './errors/certificate-errors.enum';
