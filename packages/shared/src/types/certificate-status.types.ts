/**
 * Tipos compartilhados para status de certidão
 * Usado tanto no frontend quanto no backend
 */

/**
 * Cores padrão utilizadas para status de certidões
 * Estas cores seguem a paleta Tailwind CSS
 */
export const CERTIFICATE_STATUS_COLORS = {
  /** Cor padrão para status pendente (amber-500) */
  PENDING: '#f59e0b',
  /** Cor padrão para status não definido (gray-500) */
  DEFAULT: '#6b7280',
  /** Cor para status de sucesso (green-500) */
  SUCCESS: '#22c55e',
  /** Cor para status de erro (red-500) */
  ERROR: '#ef4444',
  /** Cor para status de informação (blue-500) */
  INFO: '#3b82f6',
} as const;

/**
 * Valores padrão para criação de novos status
 */
export const CERTIFICATE_STATUS_DEFAULTS = {
  COLOR: CERTIFICATE_STATUS_COLORS.DEFAULT,
  DISPLAY_ORDER: 0,
  CAN_EDIT_CERTIFICATE: true,
  IS_FINAL: false,
} as const;

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
