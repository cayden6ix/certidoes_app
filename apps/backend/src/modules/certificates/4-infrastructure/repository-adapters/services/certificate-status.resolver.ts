import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import type { CertificateStatusRow } from '../types/certificate-row.types';
import type { CertificateStatusInfo } from '@shared/types';

/**
 * Serviço responsável por resolver IDs de status de certidão
 * Encapsula a lógica de busca e mapeamento de status
 */
export class CertificateStatusResolver {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Resolve o ID do status de certidão pelo nome
   * @param statusName - Nome do status (ex: 'pending', 'in_progress')
   * @returns ID do status ou erro
   */
  async resolveStatusId(statusName: string): Promise<Result<string>> {
    const normalizedStatus = statusName.trim().toLowerCase();

    const { data, error } = await this.supabaseClient
      .from('certificate_status')
      .select('id')
      .eq('name', normalizedStatus)
      .maybeSingle();

    if (error) {
      this.logger.error('Erro ao buscar status de certidão', {
        error: error.message,
        statusName: normalizedStatus,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }

    if (!data) {
      this.logger.error('Status de certidão não encontrado', {
        statusName: normalizedStatus,
      });
      return failure(CertificateError.INVALID_STATUS);
    }

    return success((data as { id: string }).id);
  }

  /**
   * Busca informações completas de status por IDs
   * @param ids - Lista de IDs para buscar
   * @returns Mapa de ID -> CertificateStatusInfo
   */
  async fetchStatusInfoMap(ids: string[]): Promise<Map<string, CertificateStatusInfo>> {
    const map = new Map<string, CertificateStatusInfo>();

    if (ids.length === 0) {
      return map;
    }

    const uniqueIds = [...new Set(ids)];

    const { data, error } = await this.supabaseClient
      .from('certificate_status')
      .select('id, name, display_name, color, can_edit_certificate, is_final')
      .in('id', uniqueIds);

    if (error) {
      this.logger.error('Erro ao buscar informações de status', {
        error: error.message,
      });
      return map;
    }

    (data as CertificateStatusRow[]).forEach((row) => {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        color: row.color,
        canEditCertificate: row.can_edit_certificate,
        isFinal: row.is_final,
      });
    });

    return map;
  }

  /**
   * Busca o status padrão (pending)
   * @returns ID do status padrão ou erro
   */
  async getDefaultStatusId(): Promise<Result<string>> {
    return this.resolveStatusId('pending');
  }

  /**
   * Verifica se um status permite edição da certidão
   * @param statusId - ID do status
   * @returns true se permite edição
   */
  async canEditCertificate(statusId: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from('certificate_status')
      .select('can_edit_certificate')
      .eq('id', statusId)
      .maybeSingle();

    if (error || !data) {
      this.logger.warn('Não foi possível verificar permissão de edição do status', {
        statusId,
        error: error?.message,
      });
      return false;
    }

    return (data as { can_edit_certificate: boolean }).can_edit_certificate;
  }
}
