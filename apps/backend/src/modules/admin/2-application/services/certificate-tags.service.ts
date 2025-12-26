import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import type { CertificateTag } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
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

  /**
   * Associa uma tag a um certificado
   */
  async assignTagToCertificate(certificateId: string, tagId: string): Promise<void> {
    // Verifica se já existe a associação
    const { data: existing } = await this.supabase
      .from('certificate_tag_assignments')
      .select('id')
      .eq('certificate_id', certificateId)
      .eq('tag_id', tagId)
      .maybeSingle();

    if (existing) {
      // Já existe, não faz nada
      return;
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
      throw new BadRequestException('Não foi possível associar a tag ao certificado');
    }
  }

  /**
   * Remove a associação de uma tag de um certificado
   */
  async unassignTagFromCertificate(certificateId: string, tagId: string): Promise<void> {
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
      throw new BadRequestException('Não foi possível remover a tag do certificado');
    }
  }

  /**
   * Atualiza todas as tags de um certificado (substitui as existentes)
   * @param certificateId - ID do certificado
   * @param tagIds - IDs das novas tags
   * @param actorUserId - ID do usuário que está fazendo a alteração (para auditoria)
   */
  async updateCertificateTags(
    certificateId: string,
    tagIds: string[],
    actorUserId?: string,
  ): Promise<void> {
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
      throw new BadRequestException('Não foi possível atualizar as tags do certificado');
    }

    // Se não há novas tags, registra o evento e retorna
    if (tagIds.length === 0) {
      if (actorUserId && previousTags.length > 0) {
        await this.createTagChangeEvent(certificateId, actorUserId, previousTags, []);
      }
      return;
    }

    // Busca os nomes das novas tags para o evento de auditoria
    const { data: newTagsData } = await this.supabase
      .from('certificate_tags')
      .select('id, name')
      .in('id', tagIds);

    const newTagNames = (newTagsData ?? []).map((tag) => tag.name);

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
      throw new BadRequestException('Não foi possível atualizar as tags do certificado');
    }

    // Cria evento de auditoria se houver mudança
    if (actorUserId) {
      const tagsChanged =
        previousTags.length !== newTagNames.length ||
        !previousTags.every((tag) => newTagNames.includes(tag));

      if (tagsChanged) {
        await this.createTagChangeEvent(certificateId, actorUserId, previousTags, newTagNames);
      }
    }
  }

  /**
   * Cria um evento de auditoria para mudança de tags
   */
  private async createTagChangeEvent(
    certificateId: string,
    actorUserId: string,
    previousTags: string[],
    newTags: string[],
  ): Promise<void> {
    const { error } = await this.supabase.from('certificate_events').insert({
      certificate_id: certificateId,
      actor_user_id: actorUserId,
      actor_role: 'admin',
      event_type: 'tags_updated',
      changes: {
        tags: {
          before: previousTags.length > 0 ? previousTags.join(', ') : 'Nenhuma',
          after: newTags.length > 0 ? newTags.join(', ') : 'Nenhuma',
        },
      },
    });

    if (error) {
      this.logger.warn('Falha ao registrar evento de alteração de tags', {
        error: error.message,
        certificateId,
      });
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
        creators.get((row as Record<string, string | null>).created_by!)
          ? (creators.get((row as Record<string, string | null>).created_by!) ?? null)
          : null,
      createdAt: row.created_at,
    };
  }
}
