/**
 * Tipos compartilhados para status de certidão
 * Usado tanto no frontend quanto no backend
 */

/**
 * Dados completos de um status de certidão
 */
export interface CertificateStatusConfig {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  displayOrder: number;
  isActive: boolean;
  canEditCertificate: boolean;
  isFinal: boolean;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Dados resumidos de status para exibição em certidões
 */
export interface CertificateStatusInfo {
  id: string;
  name: string;
  displayName: string;
  color: string;
  canEditCertificate: boolean;
  isFinal: boolean;
}

/**
 * Request para criar um novo status
 */
export interface CreateCertificateStatusRequest {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

/**
 * Request para atualizar um status existente
 */
export interface UpdateCertificateStatusRequest {
  displayName?: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

/**
 * Response da listagem de status
 */
export interface ListCertificateStatusResponse {
  data: CertificateStatusConfig[];
  total: number;
}
