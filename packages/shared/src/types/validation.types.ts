/**
 * Tipos compartilhados para validações administrativas
 */

export interface ValidationConfig {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateStatusValidationRule {
  id: string;
  statusId: string;
  statusName: string;
  validationId: string;
  validationName: string;
  validationDescription: string | null;
  requiredField: string | null;
  confirmationText: string | null;
  createdAt: string;
  updatedAt: string;
}
