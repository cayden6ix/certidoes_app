import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type {
  CertificateTagRepositoryContract,
  CertificateTagData,
  ListTagsParams,
  PaginatedTags,
  CreateTagParams,
  UpdateTagParams,
} from '../../1-domain/contracts/certificate-tag.repository.contract';

/**
 * Implementação do repositório de tags de certidão usando Supabase
 * Responsável por todas as operações de persistência de tags
 */
export class SupabaseCertificateTagRepository implements CertificateTagRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListTagsParams): Promise<Result<PaginatedTags>> {
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
      return failure('Não foi possível listar as tags');
    }

    const rows = (data ?? []) as Tables<'certificate_tags'>[];
    const creatorIds = rows.map((row) => row.created_by).filter(Boolean) as string[];
    const creators = await this.fetchCreatorNames(creatorIds);

    return success({
      data: rows.map((row) => this.mapTag(row, creators)),
      total: count ?? 0,
    });
  }

  async create(params: CreateTagParams): Promise<Result<CertificateTagData>> {
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
      return failure('Não foi possível criar a tag');
    }

    const row = data as Tables<'certificate_tags'>;
    return success(this.mapTag(row, new Map()));
  }

  async update(id: string, params: UpdateTagParams): Promise<Result<CertificateTagData>> {
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
      return failure('Não foi possível atualizar a tag');
    }

    const row = data as Tables<'certificate_tags'>;
    return success(this.mapTag(row, new Map()));
  }

  async remove(id: string): Promise<Result<void>> {
    // Remove atribuições antes para evitar erro de FK
    const { error: assignmentError } = await this.supabase
      .from('certificate_tag_assignments')
      .delete()
      .eq('tag_id', id);

    if (assignmentError) {
      this.logger.error('Erro ao limpar vínculos de tag', {
        error: assignmentError.message,
        id,
      });
    }

    const { error } = await this.supabase.from('certificate_tags').delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover tag', { error: error.message, id });
      return failure('Não foi possível remover a tag');
    }

    return success(undefined);
  }

  async assignTagToCertificate(certificateId: string, tagId: string): Promise<Result<void>> {
    // Verifica se já existe a associação
    const { data: existing } = await this.supabase
      .from('certificate_tag_assignments')
      .select('id')
      .eq('certificate_id', certificateId)
      .eq('tag_id', tagId)
      .maybeSingle();

    if (existing) {
      // Já existe, não faz nada
      return success(undefined);
    }

    const { error } = await this.supabase.from('certificate_tag_assignments').insert({
      certificate_id: certificateId,
      tag_id: tagId,
    });

    if (error) {
      this.logger.error('Erro ao associar tag ao certificado', {
        error: error.message,
        certificateId,
        tagId,
      });
      return failure('Não foi possível associar a tag ao certificado');
    }

    return success(undefined);
  }

  async unassignTagFromCertificate(certificateId: string, tagId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('certificate_tag_assignments')
      .delete()
      .eq('certificate_id', certificateId)
      .eq('tag_id', tagId);

    if (error) {
      this.logger.error('Erro ao remover tag do certificado', {
        error: error.message,
        certificateId,
        tagId,
      });
      return failure('Não foi possível remover a tag do certificado');
    }

    return success(undefined);
  }

  async updateCertificateTags(
    certificateId: string,
    tagIds: string[],
  ): Promise<Result<{ previousTags: string[]; newTags: string[] }>> {
    // Busca as tags atuais para registrar no evento de auditoria
    const { data: currentAssignments } = await this.supabase
      .from('certificate_tag_assignments')
      .select(
        `
        tag_id,
        certificate_tags (
          id,
          name
        )
      `,
      )
      .eq('certificate_id', certificateId);

    const previousTags = (currentAssignments ?? []).map((row) => {
      const tagData = row.certificate_tags as { id: string; name: string } | null;
      return tagData?.name ?? row.tag_id;
    });

    // Remove todas as tags atuais
    const { error: deleteError } = await this.supabase
      .from('certificate_tag_assignments')
      .delete()
      .eq('certificate_id', certificateId);

    if (deleteError) {
      this.logger.error('Erro ao limpar tags do certificado', {
        error: deleteError.message,
        certificateId,
      });
      return failure('Não foi possível atualizar as tags do certificado');
    }

    // Se não há novas tags, retorna
    if (tagIds.length === 0) {
      return success({ previousTags, newTags: [] });
    }

    // Busca os nomes das novas tags
    const newTagNamesResult = await this.getTagNamesByIds(tagIds);
    if (!newTagNamesResult.success) {
      return failure(newTagNamesResult.error);
    }

    const newTags = newTagNamesResult.data;

    // Insere as novas tags
    const assignments = tagIds.map((tagId) => ({
      certificate_id: certificateId,
      tag_id: tagId,
    }));

    const { error: insertError } = await this.supabase
      .from('certificate_tag_assignments')
      .insert(assignments);

    if (insertError) {
      this.logger.error('Erro ao inserir tags do certificado', {
        error: insertError.message,
        certificateId,
        tagIds,
      });
      return failure('Não foi possível atualizar as tags do certificado');
    }

    return success({ previousTags, newTags });
  }

  async getTagNamesByIds(tagIds: string[]): Promise<Result<string[]>> {
    if (tagIds.length === 0) {
      return success([]);
    }

    const { data, error } = await this.supabase
      .from('certificate_tags')
      .select('id, name')
      .in('id', tagIds);

    if (error) {
      this.logger.error('Erro ao buscar nomes das tags', { error: error.message });
      return failure('Não foi possível buscar os nomes das tags');
    }

    return success((data ?? []).map((tag) => tag.name));
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

  private mapTag(
    row: Tables<'certificate_tags'>,
    creators: Map<string, string>,
  ): CertificateTagData {
    return {
      id: row.id,
      name: row.name,
      description: (row as Record<string, string | null>).description ?? null,
      color: row.color ?? null,
      createdBy:
        (row as Record<string, string | null>).created_by &&
        creators.get((row as Record<string, string | null>).created_by!)
          ? (creators.get((row as Record<string, string | null>).created_by!) ?? null)
          : null,
      createdAt: row.created_at,
    };
  }
}
