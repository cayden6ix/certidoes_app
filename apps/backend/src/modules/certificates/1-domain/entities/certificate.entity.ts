import type { CertificateStatusValueObject } from '../value-objects/certificate-status.value-object';
import type { CertificatePriorityValueObject } from '../value-objects/certificate-priority.value-object';

/**
 * Interface para criação de CertificateEntity
 */
export interface CertificateEntityProps {
  id: string;
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: CertificatePriorityValueObject;
  status: CertificateStatusValueObject;
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade que representa uma certidão solicitada
 * Encapsula dados imutáveis da certidão no sistema
 */
export class CertificateEntity {
  readonly id: string;
  readonly userId: string;
  readonly certificateType: string;
  readonly recordNumber: string;
  readonly partiesName: string;
  readonly notes: string | null;
  readonly priority: CertificatePriorityValueObject;
  readonly status: CertificateStatusValueObject;
  readonly cost: number | null;
  readonly additionalCost: number | null;
  readonly orderNumber: string | null;
  readonly paymentDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  /**
   * Construtor privado para garantir criação via factory method
   */
  private constructor(props: CertificateEntityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.certificateType = props.certificateType;
    this.recordNumber = props.recordNumber;
    this.partiesName = props.partiesName;
    this.notes = props.notes;
    this.priority = props.priority;
    this.status = props.status;
    this.cost = props.cost;
    this.additionalCost = props.additionalCost;
    this.orderNumber = props.orderNumber;
    this.paymentDate = props.paymentDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method para criar instância de CertificateEntity
   * @param props - Propriedades da certidão
   * @returns Instância de CertificateEntity
   */
  static create(props: CertificateEntityProps): CertificateEntity {
    return new CertificateEntity(props);
  }

  /**
   * Verifica se o usuário é o dono da certidão
   * @param userId - ID do usuário a verificar
   */
  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Verifica se a certidão pode ser editada
   */
  canBeEdited(): boolean {
    return this.status.canBeEdited();
  }

  /**
   * Calcula o custo total (custo + custo adicional)
   */
  getTotalCost(): number {
    return (this.cost ?? 0) + (this.additionalCost ?? 0);
  }

  /**
   * Converte a entidade em objeto plano (DTO)
   */
  toDTO() {
    return {
      id: this.id,
      userId: this.userId,
      certificateType: this.certificateType,
      recordNumber: this.recordNumber,
      partiesName: this.partiesName,
      notes: this.notes,
      priority: this.priority.getValue(),
      status: this.status.getValue(),
      cost: this.cost,
      additionalCost: this.additionalCost,
      orderNumber: this.orderNumber,
      paymentDate: this.paymentDate?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
