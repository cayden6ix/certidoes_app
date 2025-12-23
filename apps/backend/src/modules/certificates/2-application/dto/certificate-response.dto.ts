/**
 * DTO de resposta para uma certidão
 */
export interface CertificateResponseDto {
  id: string;
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: string;
  status: string;
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO de resposta para lista paginada de certidões
 */
export interface PaginatedCertificatesResponseDto {
  data: CertificateResponseDto[];
  total: number;
  limit: number;
  offset: number;
}
