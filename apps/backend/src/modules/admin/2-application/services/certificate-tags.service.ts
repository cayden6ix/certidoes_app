import {
  BadRequestException,
  Injectable,
  Inject,
} from '@nestjs/common';
import type { CertificateTag } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type { Tables, TablesInsert, TablesUpdate } from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListTagsParams {
  search?: string;
  limit: number;
  offset: number;
}

interface CreateTagParams {
  name: string;
  color?: string | null;
}

interface UpdateTagParams {
  name?: string;
  color?: string | null;
}

@Injectable()
export class CertificateTagsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(params: ListTagsParams): Promise<{ data: CertificateTag[]; total: number }> {
    const searchValue = params.search?.trim();

    let query = this.supabase
      .from('certificate_tags')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (searchValue) {
      const normalized = `%${searchValue}%`;
      query = query.or(`name.ilike.${normalized},description.ilike.${normalized}`);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Erro ao listar tags', { error: error.message });
      throw new BadRequestException('Não foi possível listar as tags');
    }

    const rows = (data ?? []) as Tables<'certificate_tags'>[];
    const creatorIds = rows.map((row) => row.created_by).filter(Boolean) as string[];
    const creators = await this.fetchCreatorNames(creatorIds);

    return {
      data: rows.map((row) => this.mapTag(row, creators)),
      total: count ?? 0,
    };
  }

  async create(params: CreateTagParams): Promise<CertificateTag> {
    const insertData: TablesInsert<'certificate_tags'> = {
      name: params.name,
      color: params.color ?? null,
    };

    const { data, error } = await this.supabase
      .from('certificate_tags')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao criar tag', { error: error?.message });
      throw new BadRequestException('Não foi possível criar a tag');
    }

    const row = data as Tables<'certificate_tags'>;
    return this.mapTag(row, new Map());
  }

  async update(id: string, params: UpdateTagParams): Promise<CertificateTag> {
    const updateData: TablesUpdate<'certificate_tags'> = {};

    if (params.name !== undefined) updateData.name = params.name;
    if (params.color !== undefined) updateData.color = params.color;

    const { data, error } = await this.supabase
      .from('certificate_tags')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao atualizar tag', { error: error?.message, id });
      throw new BadRequestException('Não foi possível atualizar a tag');
    }

    const row = data as Tables<'certificate_tags'>;
    return this.mapTag(row, new Map());
  }

  async remove(id: string): Promise<void> {
    // Remove atribuições antes para evitar erro de FK
    const { error: assignmentError } = await this.supabase
      .from('certificate_tag_assignments')
      .delete()
      .eq('tag_id', id);

    if (assignmentError) {
      this.logger.error('Erro ao limpar vínculos de tag', { error: assignmentError.message, id });
    }

    const { error } = await this.supabase.from('certificate_tags').delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover tag', { error: error.message, id });
      throw new BadRequestException('Não foi possível remover a tag');
    }
  }

  private async fetchCreatorNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();

    const { data, error } = await this.supabase
      .from('profiles')
      .select('id,full_name,email')
      .in('id', ids);

    if (error) {
      this.logger.warn('Erro ao buscar criadores de tags', { error: error.message });
      return new Map();
    }

    const map = new Map<string, string>();
    (data ?? []).forEach((row) => {
      map.set(
        (row as Tables<'profiles'>).id,
        (row as Tables<'profiles'>).full_name ?? (row as Tables<'profiles'>).email,
      );
    });

    return map;
  }

  private mapTag(row: Tables<'certificate_tags'>, creators: Map<string, string>): CertificateTag {
    return {
      id: row.id,
      name: row.name,
      description: (row as Record<string, string | null>).description ?? null,
      color: row.color ?? null,
      createdBy:
        (row as Record<string, string | null>).created_by &&
        creators.get((row as Record<string, string | null>).created_by as string)
          ? creators.get((row as Record<string, string | null>).created_by as string) ?? null
          : null,
      createdAt: row.created_at,
    };
  }
}
