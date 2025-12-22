/**
 * Tipos relacionados a certidões
 * Compartilhados entre frontend e backend
 */

/**
 * Prioridade da certidão
 */
export type CertificatePriority = 'normal' | 'urgent';

/**
 * Status da certidão
 */
export type CertificateStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

/**
 * Dados de uma certidão
 */
export interface Certificate {
  id: string;
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: CertificatePriority;
  status: CertificateStatus;
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para criação de certidão (campos do cliente)
 */
export interface CreateCertificateDto {
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes?: string;
  priority?: CertificatePriority;
}

/**
 * DTO para atualização de certidão pelo cliente
 */
export interface UpdateCertificateClientDto {
  certificateType?: string;
  recordNumber?: string;
  partiesName?: string;
  notes?: string;
  priority?: CertificatePriority;
}

/**
 * DTO para atualização de certidão pelo admin
 */
export interface UpdateCertificateAdminDto {
  status?: CertificateStatus;
  cost?: number;
  additionalCost?: number;
  orderNumber?: string;
  paymentDate?: string;
}

/**
 * DTO para atualização em massa (admin)
 */
export interface BatchUpdateCertificatesDto {
  certificateIds: string[];
  patch: UpdateCertificateAdminDto;
}
