import type { Result } from '../../../../shared/1-domain/types/result.type';

export interface StatusValidationRequirement {
  validationId: string;
  validationName: string;
  validationDescription: string | null;
  requiredField: string | null;
  confirmationText: string | null;
}

export interface CertificateStatusValidationContract {
  fetchActiveValidations(statusName: string): Promise<Result<StatusValidationRequirement[]>>;
}
