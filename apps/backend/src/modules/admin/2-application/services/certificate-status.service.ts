import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import type { CertificateStatusConfig } from '@shared/types';
import { CERTIFICATE_STATUS_DEFAULTS } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListStatusParams {
  search?: string;
  includeInactive?: boolean;
  limit: number;
  offset: number;
}

interface CreateStatusParams {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

interface UpdateStatusParams {
  displayName?: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

@Injectable()
export class CertificateStatusService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  /**
   * Lista todos os status de certidão
   */
  async list(
    params: ListStatusParams,
  ): Promise<{ data: CertificateStatusConfig[]; total: number }> {
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
      throw new BadRequestException('Não foi possível listar os status');
    }

    const rows = (data ?? []) as Tables<'certificate_status'>[];

    return {
      data: rows.map((row) => this.mapStatus(row)),
      total: count ?? 0,
    };
  }

  /**
   * Busca um status por ID
   */
  async findById(id: string): Promise<CertificateStatusConfig | null> {
    const { data, error } = await this.supabase
      .from('certificate_status')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error('Erro ao buscar status', { error: error.message, id });
      throw new BadRequestException('Não foi possível buscar o status');
    }

    if (!data) {
      return null;
    }

    return this.mapStatus(data as Tables<'certificate_status'>);
  }

  /**
   * Busca um status pelo nome
   */
  async findByName(name: string): Promise<CertificateStatusConfig | null> {
    const { data, error } = await this.supabase
      .from('certificate_status')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) {
      this.logger.error('Erro ao buscar status por nome', { error: error.message, name });
      throw new BadRequestException('Não foi possível buscar o status');
    }

    if (!data) {
      return null;
    }

    return this.mapStatus(data as Tables<'certificate_status'>);
  }

  /**
   * Cria um novo status
   */
  async create(params: CreateStatusParams): Promise<CertificateStatusConfig> {
    // Verifica se já existe um status com o mesmo nome
    const existing = await this.findByName(params.name);
    if (existing) {
      throw new BadRequestException(`Já existe um status com o nome "${params.name}"`);
    }

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
      this.logger.error('Erro ao criar status', { error: error?.message });
      throw new BadRequestException('Não foi possível criar o status');
    }

    return this.mapStatus(data as Tables<'certificate_status'>);
  }

  /**
   * Atualiza um status existente
   */
  async update(id: string, params: UpdateStatusParams): Promise<CertificateStatusConfig> {
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
      this.logger.error('Erro ao atualizar status', { error: error?.message, id });
      throw new BadRequestException('Não foi possível atualizar o status');
    }

    return this.mapStatus(data as Tables<'certificate_status'>);
  }

  /**
   * Remove um status
   * Não permite remover status que estão em uso
   */
  async remove(id: string): Promise<void> {
    // Verifica se há certidões usando este status
    const { count, error: countError } = await this.supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', id);

    if (countError) {
      this.logger.error('Erro ao verificar uso do status', { error: countError.message, id });
      throw new BadRequestException('Não foi possível verificar o uso do status');
    }

    if (count && count > 0) {
      throw new BadRequestException(
        `Não é possível remover este status pois existem ${count} certidão(ões) utilizando-o`,
      );
    }

    const { error } = await this.supabase.from('certificate_status').delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover status', { error: error.message, id });
      throw new BadRequestException('Não foi possível remover o status');
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo CertificateStatusConfig
   */
  private mapStatus(row: Tables<'certificate_status'>): CertificateStatusConfig {
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
