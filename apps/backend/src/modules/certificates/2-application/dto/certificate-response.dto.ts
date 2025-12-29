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
  /** Custo em centavos (ex: R$ 10,50 = 1050) */
  cost: number | null;
  /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
  additionalCost: number | null;
  orderNumber: string | null;
  paymentTypeId: string | null;
  paymentType: string | null;
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
