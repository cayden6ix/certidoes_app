import type { CertificatePriorityType } from '../../../1-domain/value-objects/certificate-priority.value-object';
import type { CertificatePriority } from '../../../../supabase/1-domain/types/database.types';

/**
 * Interface para tipagem da linha de certificate do banco
 *
 * NOTA: Alguns campos possuem múltiplos nomes devido a migrações históricas.
 * O CertificateMapper resolve automaticamente essas variações.
 * O campo principal é sempre listado primeiro na documentação.
 */
export interface CertificateRow {
  id: string;
  user_id: string;
  /** Campo preferencial para tipo de certidão (resolve por ID) */
  certificate_type_id?: string;
  /** @deprecated Alias legado - usar certificate_type_id */
  certificate_type?: string;
  record_number: string;
  /** Campo preferencial para nomes das partes */
  party_names?: string | string[];
  /** @deprecated Alias legado - usar party_names */
  parties_name?: string | string[];
  /** @deprecated Alias legado - usar party_names */
  parties_names?: string | string[];
  /** @deprecated Alias legado - usar observations */
  notes?: string | null;
  /** Campo preferencial para observações */
  observations?: string | null;
  priority?: 'normal' | 'urgent' | CertificatePriority | null;
  status_id: string;
  cost?: number | null;
  additional_cost?: number | null;
  order_number?: string | null;
  payment_type_id?: string | null;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para tipagem da linha de status de certidão
 */
export interface CertificateStatusRow {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  can_edit_certificate: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Interface para tipagem da linha de tipo de certidão
 */
export interface CertificateTypeRow {
  id: string;
  name: string;
}

/**
 * Tabelas possíveis para tipos de certidão
 * O banco pode ter diferentes nomes dependendo da migração
 */
export const CERTIFICATE_TYPE_TABLES = ['certificates_type'] as const;

/**
 * Mapeamento de prioridade para valor do banco
 * Usa const assertion para garantir tipagem literal (1 | 2)
 */
export const PRIORITY_TO_DB = {
  normal: 1,
  urgent: 2,
} as const satisfies Record<CertificatePriorityType, CertificatePriority>;
