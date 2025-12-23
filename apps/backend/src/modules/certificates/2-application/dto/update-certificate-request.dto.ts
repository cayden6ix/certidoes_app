/**
 * DTO para requisição de atualização de certidão
 * Usado internamente entre controller e use case
 */
export class UpdateCertificateRequestDto {
  constructor(
    public readonly certificateId: string,
    public readonly userId: string,
    public readonly userRole: 'client' | 'admin',
    public readonly data: {
      certificateType?: string;
      recordNumber?: string;
      partiesName?: string;
      notes?: string;
      priority?: 'normal' | 'urgent';
      status?: 'pending' | 'in_progress' | 'completed' | 'canceled';
      cost?: number;
      additionalCost?: number;
      orderNumber?: string;
      paymentDate?: Date;
    },
  ) {}
}
