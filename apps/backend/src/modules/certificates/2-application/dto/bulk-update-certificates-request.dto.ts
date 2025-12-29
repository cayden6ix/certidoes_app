/**
 * Dados de atualizacao individual por certidao
 */
export interface IndividualCertificateUpdateData {
  certificateId: string;
  status?: string;
  /** Custo em centavos (ex: R$ 10,50 = 1050) */
  cost?: number;
  /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
  additionalCost?: number;
  orderNumber?: string;
  paymentDate?: Date;
  paymentTypeId?: string | null;
  priority?: 'normal' | 'urgent';
}

/**
 * Dados globais aplicados a todas as certidoes
 */
export interface GlobalUpdateData {
  notes?: string;
  tagIds?: string[];
  /** Comentario a ser adicionado em todas as certidoes */
  comment?: string;
}

/**
 * DTO para requisicao de atualizacao em massa de certidoes
 * Usado internamente entre controller e use case
 */
export class BulkUpdateCertificatesRequestDto {
  constructor(
    public readonly userId: string,
    public readonly userRole: 'client' | 'admin',
    public readonly certificateIds: string[],
    public readonly globalData: GlobalUpdateData,
    public readonly individualUpdates: IndividualCertificateUpdateData[],
    public readonly validation?: {
      confirmed?: boolean;
      statement?: string;
    },
  ) {}
}
