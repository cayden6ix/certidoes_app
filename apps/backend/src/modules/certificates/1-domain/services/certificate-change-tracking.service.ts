import type { CertificateEntity } from '../entities/certificate.entity';

/**
 * Snapshot de uma certidão para comparação de mudanças
 */
export interface CertificateSnapshot {
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: string;
  status: string;
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentType: string | null;
  paymentTypeId: string | null;
  paymentDate: string | null;
}

/**
 * Representa uma mudança individual em um campo
 */
export interface FieldChange {
  before: unknown;
  after: unknown;
}

/**
 * Mapa de mudanças por campo
 */
export type ChangeMap = Record<string, FieldChange>;

/**
 * Tipos de evento para auditoria
 */
export type CertificateEventType = 'created' | 'updated' | 'status_changed';

/**
 * Serviço de domínio puro para rastreamento de mudanças em certidões
 * Responsável por criar snapshots, calcular diferenças e determinar tipo de evento
 * Não possui dependências de infraestrutura (Clean Architecture)
 */
export class CertificateChangeTrackingService {
  /**
   * Cria um snapshot da certidão para comparação posterior
   * @param certificate - Entidade da certidão
   * @returns Snapshot com valores normalizados
   */
  createSnapshot(certificate: CertificateEntity): CertificateSnapshot {
    return {
      certificateType: certificate.certificateType,
      recordNumber: certificate.recordNumber,
      partiesName: certificate.partiesName,
      notes: certificate.notes,
      priority: certificate.priority.getValue(),
      status: certificate.status.getName(),
      cost: certificate.cost,
      additionalCost: certificate.additionalCost,
      orderNumber: certificate.orderNumber,
      paymentType: certificate.paymentType ?? certificate.paymentTypeId ?? null,
      paymentTypeId: certificate.paymentTypeId ?? null,
      paymentDate: certificate.paymentDate ? certificate.paymentDate.toISOString() : null,
    };
  }

  /**
   * Cria snapshot a partir da entidade atualizada com dados do update
   * @param updatedCertificate - Certidão após atualização
   * @param updateData - Dados que foram usados na atualização
   * @returns Snapshot atualizado
   */
  createUpdatedSnapshot(
    updatedCertificate: CertificateEntity,
    updateData: Record<string, unknown>,
  ): CertificateSnapshot {
    return {
      certificateType: updatedCertificate.certificateType,
      recordNumber: updatedCertificate.recordNumber,
      partiesName: updatedCertificate.partiesName,
      notes: updatedCertificate.notes,
      priority: updatedCertificate.priority.getValue(),
      status: updatedCertificate.status.getName(),
      cost: updatedCertificate.cost,
      additionalCost: updatedCertificate.additionalCost,
      orderNumber: updatedCertificate.orderNumber,
      paymentType:
        updatedCertificate.paymentType ??
        updatedCertificate.paymentTypeId ??
        (updateData.paymentTypeId as string | null) ??
        null,
      paymentTypeId:
        updatedCertificate.paymentTypeId ?? (updateData.paymentTypeId as string | null) ?? null,
      paymentDate: updatedCertificate.paymentDate
        ? updatedCertificate.paymentDate.toISOString()
        : null,
    };
  }

  /**
   * Normaliza valor vazio para null (para comparações consistentes)
   * @param value - Valor a normalizar
   */
  private normalizeEmpty(value: unknown): unknown {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return value;
  }

  /**
   * Calcula as mudanças entre dois snapshots baseado nos campos que foram alterados
   * @param previousSnapshot - Snapshot antes da atualização
   * @param updatedSnapshot - Snapshot após a atualização
   * @param changedFields - Lista de campos que foram alterados
   * @returns Mapa de mudanças por campo
   */
  calculateChanges(
    previousSnapshot: CertificateSnapshot,
    updatedSnapshot: CertificateSnapshot,
    changedFields: string[],
  ): ChangeMap {
    const changes: ChangeMap = {};

    for (const field of changedFields) {
      if (field === 'status') {
        changes[field] = {
          before: this.normalizeEmpty(previousSnapshot.status),
          after: this.normalizeEmpty(updatedSnapshot.status),
        };
      } else {
        const typedField = field as keyof CertificateSnapshot;
        changes[field] = {
          before: this.normalizeEmpty(previousSnapshot[typedField]),
          after: this.normalizeEmpty(updatedSnapshot[typedField]),
        };
      }
    }

    return changes;
  }

  /**
   * Determina o tipo de evento baseado nos campos alterados
   * @param changedFields - Lista de campos que foram alterados
   * @returns Tipo do evento (status_changed ou updated)
   */
  determineEventType(changedFields: string[]): CertificateEventType {
    if (changedFields.length === 1 && changedFields[0] === 'status') {
      return 'status_changed';
    }
    return 'updated';
  }

  /**
   * Verifica se há mudança de status nos dados de atualização
   * @param currentStatus - Status atual da certidão
   * @param updateData - Dados de atualização
   * @param isAdmin - Se o usuário é admin
   * @returns Status novo se houver mudança, undefined caso contrário
   */
  detectStatusChange(
    currentStatus: string,
    updateData: Record<string, unknown>,
    isAdmin: boolean,
  ): string | undefined {
    if (!isAdmin) {
      return undefined;
    }

    const nextStatus =
      typeof updateData.status === 'string' && updateData.status.trim()
        ? updateData.status.trim()
        : undefined;

    if (nextStatus && nextStatus !== currentStatus) {
      return nextStatus;
    }

    return undefined;
  }
}
