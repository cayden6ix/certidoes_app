import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';

/**
 * Valores válidos para prioridade de certidão
 */
export type CertificatePriorityType = 'normal' | 'urgent';

/**
 * Value Object para prioridade de certidão
 * Garante que apenas valores válidos sejam usados
 */
export class CertificatePriorityValueObject {
  private static readonly VALID_PRIORITIES: CertificatePriorityType[] = ['normal', 'urgent'];

  private constructor(private readonly value: CertificatePriorityType) {}

  /**
   * Factory method para criar instância validada
   * @param priority - Prioridade a ser validada
   * @returns Result com CertificatePriorityValueObject ou erro
   */
  static create(priority: string): Result<CertificatePriorityValueObject> {
    if (!CertificatePriorityValueObject.isValid(priority)) {
      return failure(
        `Prioridade inválida: ${priority}. Valores permitidos: ${CertificatePriorityValueObject.VALID_PRIORITIES.join(', ')}`,
      );
    }

    return success(new CertificatePriorityValueObject(priority));
  }

  /**
   * Verifica se a prioridade é válida
   */
  static isValid(priority: string): priority is CertificatePriorityType {
    return CertificatePriorityValueObject.VALID_PRIORITIES.includes(
      priority as CertificatePriorityType,
    );
  }

  /**
   * Retorna o valor da prioridade
   */
  getValue(): CertificatePriorityType {
    return this.value;
  }

  /**
   * Verifica se é prioridade normal
   */
  isNormal(): boolean {
    return this.value === 'normal';
  }

  /**
   * Verifica se é prioridade urgente
   */
  isUrgent(): boolean {
    return this.value === 'urgent';
  }

  /**
   * Compara com outra prioridade
   */
  equals(other: CertificatePriorityValueObject): boolean {
    return this.value === other.value;
  }
}
