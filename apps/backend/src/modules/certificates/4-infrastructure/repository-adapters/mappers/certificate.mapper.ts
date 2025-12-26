import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import {
  CertificateEntity,
  type CertificateTagData,
} from '../../../1-domain/entities/certificate.entity';
import { CertificateStatusValueObject } from '../../../1-domain/value-objects/certificate-status.value-object';
import {
  CertificatePriorityValueObject,
  type CertificatePriorityType,
} from '../../../1-domain/value-objects/certificate-priority.value-object';
import type { CertificatePriority } from '../../../../supabase/1-domain/types/database.types';
import type { CertificateRow } from '../types/certificate-row.types';
import { PRIORITY_TO_DB } from '../types/certificate-row.types';
import type { CertificateStatusInfo } from '@shared/types';
import { CERTIFICATE_STATUS_COLORS, CERTIFICATE_STATUS_DEFAULTS } from '@shared/types';

/**
 * Status padrão para certificados sem status definido
 */
const DEFAULT_STATUS_INFO: CertificateStatusInfo = {
  id: '',
  name: 'pending',
  displayName: 'Pendente',
  color: CERTIFICATE_STATUS_COLORS.PENDING,
  canEditCertificate: CERTIFICATE_STATUS_DEFAULTS.CAN_EDIT_CERTIFICATE,
  isFinal: CERTIFICATE_STATUS_DEFAULTS.IS_FINAL,
};

/**
 * Mapper responsável por converter dados do banco para entidades de domínio
 * Segue Single Responsibility Principle
 */
export class CertificateMapper {
  constructor(private readonly logger: LoggerContract) {}

  /**
   * Mapeia uma linha do banco para entidade de domínio
   * @param row - Linha do banco de dados
   * @param certificateTypeName - Nome do tipo de certidão (opcional, resolvido externamente)
   * @param paymentTypeName - Nome do tipo de pagamento (opcional, resolvido externamente)
   * @param tags - Tags associadas à certidão
   * @param statusInfo - Informações do status (resolvidas externamente)
   * @returns Entidade ou null se falhar
   */
  mapToEntity(
    row: CertificateRow,
    certificateTypeName?: string,
    paymentTypeName?: string | null,
    tags: CertificateTagData[] = [],
    statusInfo?: CertificateStatusInfo,
  ): CertificateEntity | null {
    try {
      const statusData = statusInfo ?? DEFAULT_STATUS_INFO;
      const statusResult = CertificateStatusValueObject.fromInfo(statusData);

      if (!statusResult.success) {
        this.logger.error('Status inválido no banco', { statusId: row.status_id, id: row.id });
        return null;
      }

      const priorityValue = this.mapPriorityFromDb(row.priority);
      const priorityResult = CertificatePriorityValueObject.create(priorityValue);

      if (!priorityResult.success) {
        this.logger.error('Prioridade inválida no banco', {
          priority: priorityValue,
          id: row.id,
        });
        return null;
      }

      return CertificateEntity.create({
        id: row.id,
        userId: row.user_id,
        certificateType: certificateTypeName ?? this.resolveCertificateTypeFromRow(row),
        recordNumber: row.record_number,
        partiesName: this.resolvePartiesName(row),
        notes: this.resolveNotes(row),
        priority: priorityResult.data,
        status: statusResult.data,
        cost: row.cost ?? null,
        additionalCost: row.additional_cost ?? null,
        orderNumber: row.order_number ?? null,
        paymentTypeId: row.payment_type_id ?? null,
        paymentType: paymentTypeName ?? this.resolvePaymentTypeFromRow(row),
        paymentDate: row.payment_date ? new Date(row.payment_date) : null,
        tags,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao mapear certidão';
      this.logger.error('Erro ao mapear certidão para entidade', {
        error: errorMessage,
        id: row.id,
      });
      return null;
    }
  }

  /**
   * Mapeia múltiplas linhas para entidades
   * Filtra automaticamente as que falharem no mapeamento
   * @param rows - Linhas do banco de dados
   * @param typeNameMap - Mapa de IDs de tipo para nomes
   * @param paymentTypeNameMap - Mapa de IDs de tipo de pagamento para nomes
   * @param tagsMap - Mapa de IDs de certificado para suas tags
   * @param statusInfoMap - Mapa de IDs de status para suas informações
   */
  mapManyToEntities(
    rows: CertificateRow[],
    typeNameMap: Map<string, string>,
    paymentTypeNameMap: Map<string, string>,
    tagsMap: Map<string, CertificateTagData[]> = new Map(),
    statusInfoMap: Map<string, CertificateStatusInfo> = new Map(),
  ): CertificateEntity[] {
    return rows
      .map((row) =>
        this.mapToEntity(
          row,
          this.resolveCertificateTypeName(row, typeNameMap),
          this.resolvePaymentTypeName(row, paymentTypeNameMap),
          tagsMap.get(row.id) ?? [],
          statusInfoMap.get(row.status_id),
        ),
      )
      .filter((entity): entity is CertificateEntity => entity !== null);
  }

  /**
   * Converte prioridade para valor do banco
   */
  mapPriorityToDb(priority: CertificatePriorityType): CertificatePriority {
    return PRIORITY_TO_DB[priority];
  }

  /**
   * Converte prioridade do banco para tipo de domínio
   */
  mapPriorityFromDb(priority: CertificateRow['priority']): CertificatePriorityType {
    if (priority === 'urgent' || priority === 'normal') {
      return priority;
    }

    if (typeof priority === 'number') {
      return priority >= PRIORITY_TO_DB.urgent ? 'urgent' : 'normal';
    }

    return 'normal';
  }

  /**
   * Resolve o nome das partes de diferentes colunas possíveis
   * Ordem de prioridade: party_names (preferencial) > parties_names > parties_name
   * @see CertificateRow para detalhes sobre campos legados
   */
  resolvePartiesName(row: CertificateRow): string {
    const value = row.party_names ?? row.parties_names ?? row.parties_name;

    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value;
  }

  /**
   * Resolve notas/observações de diferentes colunas possíveis
   * Ordem de prioridade: observations (preferencial) > notes
   * @see CertificateRow para detalhes sobre campos legados
   */
  resolveNotes(row: CertificateRow): string | null {
    return row.observations ?? row.notes ?? null;
  }

  /**
   * Resolve o nome do tipo de certidão usando mapa de IDs
   */
  resolveCertificateTypeName(row: CertificateRow, typeNameMap: Map<string, string>): string {
    if (row.certificate_type) {
      return row.certificate_type;
    }

    if (row.certificate_type_id) {
      return typeNameMap.get(row.certificate_type_id) ?? row.certificate_type_id;
    }

    return '';
  }

  /**
   * Resolve o nome do tipo de certidão diretamente da linha
   * Usado quando não há mapa de tipos disponível
   */
  private resolveCertificateTypeFromRow(row: CertificateRow): string {
    return row.certificate_type ?? row.certificate_type_id ?? '';
  }

  /**
   * Resolve o nome do tipo de pagamento usando mapa de IDs
   */
  resolvePaymentTypeName(row: CertificateRow, typeNameMap: Map<string, string>): string | null {
    if (!row.payment_type_id) {
      return null;
    }

    return typeNameMap.get(row.payment_type_id) ?? row.payment_type_id;
  }

  /**
   * Resolve o nome do tipo de pagamento diretamente da linha
   */
  private resolvePaymentTypeFromRow(row: CertificateRow): string | null {
    if (!row.payment_type_id) {
      return null;
    }

    return row.payment_type_id;
  }

  /**
   * Formata nomes de partes para array (quando necessário pelo banco)
   */
  formatPartyNames(value: unknown): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value
      .split(/[,;\n]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }
}
