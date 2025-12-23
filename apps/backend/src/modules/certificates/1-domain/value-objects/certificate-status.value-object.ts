import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';

/**
 * Valores válidos para status de certidão
 */
export type CertificateStatusType = 'pending' | 'in_progress' | 'completed' | 'canceled';

/**
 * Value Object para status de certidão
 * Garante que apenas valores válidos sejam usados
 */
export class CertificateStatusValueObject {
  private static readonly VALID_STATUSES: CertificateStatusType[] = [
    'pending',
    'in_progress',
    'completed',
    'canceled',
  ];

  private constructor(private readonly value: CertificateStatusType) {}

  /**
   * Factory method para criar instância validada
   * @param status - Status a ser validado
   * @returns Result com CertificateStatusValueObject ou erro
   */
  static create(status: string): Result<CertificateStatusValueObject> {
    if (!CertificateStatusValueObject.isValid(status)) {
      return failure(
        `Status inválido: ${status}. Valores permitidos: ${CertificateStatusValueObject.VALID_STATUSES.join(', ')}`,
      );
    }

    return success(new CertificateStatusValueObject(status as CertificateStatusType));
  }

  /**
   * Verifica se o status é válido
   */
  static isValid(status: string): status is CertificateStatusType {
    return CertificateStatusValueObject.VALID_STATUSES.includes(status as CertificateStatusType);
  }

  /**
   * Retorna o valor do status
   */
  getValue(): CertificateStatusType {
    return this.value;
  }

  /**
   * Verifica se está pendente
   */
  isPending(): boolean {
    return this.value === 'pending';
  }

  /**
   * Verifica se está em andamento
   */
  isInProgress(): boolean {
    return this.value === 'in_progress';
  }

  /**
   * Verifica se está concluída
   */
  isCompleted(): boolean {
    return this.value === 'completed';
  }

  /**
   * Verifica se está cancelada
   */
  isCanceled(): boolean {
    return this.value === 'canceled';
  }

  /**
   * Verifica se pode ser editada (não finalizada)
   */
  canBeEdited(): boolean {
    return this.value === 'pending' || this.value === 'in_progress';
  }

  /**
   * Compara com outro status
   */
  equals(other: CertificateStatusValueObject): boolean {
    return this.value === other.value;
  }
}
