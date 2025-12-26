import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import { CERTIFICATE_STATUS_DEFAULTS } from '@shared/types';
import type {
  CertificateStatusRepositoryContract,
  CertificateStatusData,
  ListCertificateStatusParams,
  PaginatedCertificateStatus,
  CreateCertificateStatusParams,
  UpdateCertificateStatusParams,
} from '../../1-domain/contracts/certificate-status.repository.contract';

/**
 * Erros específicos do repositório de status de certidão
 */
export const CertificateStatusRepositoryError = {
  LIST_FAILED: 'Não foi possível listar os status de certidão',
  FIND_BY_ID_FAILED: 'Não foi possível buscar o status',
  FIND_BY_NAME_FAILED: 'Não foi possível buscar o status por nome',
  COUNT_CERTIFICATES_FAILED: 'Não foi possível verificar o uso do status',
  CREATE_FAILED: 'Não foi possível criar o status',
  UPDATE_FAILED: 'Não foi possível atualizar o status',
  REMOVE_FAILED: 'Não foi possível remover o status',
} as const;

/**
 * Implementação do repositório de status de certidão usando Supabase
 */
export class SupabaseCertificateStatusRepository implements CertificateStatusRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListCertificateStatusParams): Promise<Result<PaginatedCertificateStatus>> {
    try {
      const searchValue = params.search?.trim();

      let query = this.supabase
        .from('certificate_status')
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      // Filtra apenas ativos se não solicitado incluir inativos
      if (!params.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (searchValue) {
        const normalized = `%${searchValue}%`;
        query = query.or(
          `name.ilike.${normalized},display_name.ilike.${normalized},description.ilike.${normalized}`,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar status de certidão', { error: error.message });
        return failure(CertificateStatusRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as Tables<'certificate_status'>[];

      return success({
        data: rows.map((row) => this.mapStatus(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar status de certidão', { error: errorMessage });
      return failure(CertificateStatusRepositoryError.LIST_FAILED);
    }
  }

  async findById(id: string): Promise<Result<CertificateStatusData | null>> {
    try {
      const { data, error } = await this.supabase
        .from('certificate_status')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this.logger.error('Erro ao buscar status por ID', { error: error.message, id });
        return failure(CertificateStatusRepositoryError.FIND_BY_ID_FAILED);
      }

      if (!data) {
        return success(null);
      }

      return success(this.mapStatus(data as Tables<'certificate_status'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar status por ID', { error: errorMessage, id });
      return failure(CertificateStatusRepositoryError.FIND_BY_ID_FAILED);
    }
  }

  async findByName(name: string): Promise<Result<CertificateStatusData | null>> {
    try {
      const { data, error } = await this.supabase
        .from('certificate_status')
        .select('*')
        .eq('name', name)
        .maybeSingle();

      if (error) {
        this.logger.error('Erro ao buscar status por nome', { error: error.message, name });
        return failure(CertificateStatusRepositoryError.FIND_BY_NAME_FAILED);
      }

      if (!data) {
        return success(null);
      }

      return success(this.mapStatus(data as Tables<'certificate_status'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar status por nome', { error: errorMessage, name });
      return failure(CertificateStatusRepositoryError.FIND_BY_NAME_FAILED);
    }
  }

  async countCertificatesUsingStatus(statusId: string): Promise<Result<number>> {
    try {
      const { count, error } = await this.supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', statusId);

      if (error) {
        this.logger.error('Erro ao contar certidões usando status', {
          error: error.message,
          statusId,
        });
        return failure(CertificateStatusRepositoryError.COUNT_CERTIFICATES_FAILED);
      }

      return success(count ?? 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao contar certidões usando status', {
        error: errorMessage,
        statusId,
      });
      return failure(CertificateStatusRepositoryError.COUNT_CERTIFICATES_FAILED);
    }
  }

  async create(params: CreateCertificateStatusParams): Promise<Result<CertificateStatusData>> {
    try {
      const insertData: TablesInsert<'certificate_status'> = {
        name: params.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: params.displayName,
        description: params.description ?? null,
        color: params.color ?? CERTIFICATE_STATUS_DEFAULTS.COLOR,
        display_order: params.displayOrder ?? CERTIFICATE_STATUS_DEFAULTS.DISPLAY_ORDER,
        can_edit_certificate:
          params.canEditCertificate ?? CERTIFICATE_STATUS_DEFAULTS.CAN_EDIT_CERTIFICATE,
        is_final: params.isFinal ?? CERTIFICATE_STATUS_DEFAULTS.IS_FINAL,
      };

      const { data, error } = await this.supabase
        .from('certificate_status')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao criar status de certidão', { error: error?.message });
        return failure(CertificateStatusRepositoryError.CREATE_FAILED);
      }

      return success(this.mapStatus(data as Tables<'certificate_status'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar status de certidão', { error: errorMessage });
      return failure(CertificateStatusRepositoryError.CREATE_FAILED);
    }
  }

  async update(
    id: string,
    params: UpdateCertificateStatusParams,
  ): Promise<Result<CertificateStatusData>> {
    try {
      const updateData: TablesUpdate<'certificate_status'> = {};

      if (params.displayName !== undefined) updateData.display_name = params.displayName;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.color !== undefined) updateData.color = params.color;
      if (params.displayOrder !== undefined) updateData.display_order = params.displayOrder;
      if (params.isActive !== undefined) updateData.is_active = params.isActive;
      if (params.canEditCertificate !== undefined)
        updateData.can_edit_certificate = params.canEditCertificate;
      if (params.isFinal !== undefined) updateData.is_final = params.isFinal;

      const { data, error } = await this.supabase
        .from('certificate_status')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao atualizar status de certidão', { error: error?.message, id });
        return failure(CertificateStatusRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapStatus(data as Tables<'certificate_status'>));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar status de certidão', {
        error: errorMessage,
        id,
      });
      return failure(CertificateStatusRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.from('certificate_status').delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao remover status de certidão', { error: error.message, id });
        return failure(CertificateStatusRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover status de certidão', { error: errorMessage, id });
      return failure(CertificateStatusRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo CertificateStatusData
   */
  private mapStatus(row: Tables<'certificate_status'>): CertificateStatusData {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      color: row.color,
      displayOrder: row.display_order,
      isActive: row.is_active,
      canEditCertificate: row.can_edit_certificate,
      isFinal: row.is_final,
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }
}
