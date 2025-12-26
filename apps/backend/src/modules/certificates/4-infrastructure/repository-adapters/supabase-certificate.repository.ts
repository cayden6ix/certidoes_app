import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateRepositoryContract,
  CreateCertificateData,
  UpdateCertificateData,
  ListCertificatesOptions,
  PaginatedCertificates,
} from '../../1-domain/contracts/certificate.repository.contract';
import type {
  CertificateEntity,
  CertificateTagData,
} from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import type { CertificateRow } from './types/certificate-row.types';
import { CertificateMapper } from './mappers/certificate.mapper';
import { CertificateTypeResolver } from './services/certificate-type.resolver';
import { CertificateStatusResolver } from './services/certificate-status.resolver';
import { CertificateSearchHelper } from './helpers/search.helper';

/**
 * Implementação de repositório de certidões com Supabase
 * Usa serviceRoleKey para bypass de RLS (controle de permissões no backend)
 *
 * Responsabilidades delegadas:
 * - CertificateMapper: conversão de dados do banco para entidades
 * - CertificateTypeResolver: resolução de IDs de tipos de certidão
 * - CertificateSearchHelper: normalização de valores de busca
 */
export class SupabaseCertificateRepository implements CertificateRepositoryContract {
  private readonly mapper: CertificateMapper;
  private readonly typeResolver: CertificateTypeResolver;
  private readonly statusResolver: CertificateStatusResolver;

  constructor(
    private readonly supabaseClient: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.mapper = new CertificateMapper(logger);
    this.typeResolver = new CertificateTypeResolver(supabaseClient, logger);
    this.statusResolver = new CertificateStatusResolver(supabaseClient, logger);
    this.logger.debug('Repositório de certidões Supabase inicializado');
  }

  /**
   * Cria uma nova certidão
   */
  async create(data: CreateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      const typeIdResult = await this.typeResolver.resolveTypeId(data.certificateType);

      if (!typeIdResult.success) {
        return failure(typeIdResult.error);
      }

      const defaultStatusResult = await this.statusResolver.getDefaultStatusId();
      if (!defaultStatusResult.success) {
        return failure(defaultStatusResult.error);
      }

      const insertData = this.buildInsertData(data, typeIdResult.data, defaultStatusResult.data);

      const { data: insertedData, error } = await this.supabaseClient
        .from('certificates')
        .insert(insertData)
        .select()
        .single();

      if (error || !insertedData) {
        this.logger.error('Erro ao criar certidão no banco', {
          error: error?.message,
          userId: data.userId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typedInsertedData = insertedData as Tables<'certificates'>;
      const row = this.mapDatabaseRowToCertificateRow(typedInsertedData);
      // Busca informações do status padrão
      const statusInfoMap = await this.statusResolver.fetchStatusInfoMap([row.status_id]);
      const statusInfo = statusInfoMap.get(row.status_id);
      // Certidão recém-criada não tem tags
      const entity = this.mapper.mapToEntity(row, data.certificateType, null, [], statusInfo);

      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar certidão';
      this.logger.error('Erro crítico ao criar certidão', { error: errorMessage });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Busca certidão por ID
   */
  async findById(id: string): Promise<Result<CertificateEntity>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao buscar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typedData = data as Tables<'certificates'>;
      const row = this.mapDatabaseRowToCertificateRow(typedData);
      const typeNameMap = await this.typeResolver.fetchTypeNameMap(
        row.certificate_type_id ? [row.certificate_type_id] : [],
      );
      const paymentTypeNameMap = await this.fetchPaymentTypeNameMap(
        row.payment_type_id ? [row.payment_type_id] : [],
      );
      const statusInfoMap = await this.statusResolver.fetchStatusInfoMap([row.status_id]);
      const tagsMap = await this.fetchTagsMap([id]);
      const tags = tagsMap.get(id) ?? [];

      const certificateTypeName = this.mapper.resolveCertificateTypeName(row, typeNameMap);
      const paymentTypeName = this.mapper.resolvePaymentTypeName(row, paymentTypeNameMap);
      const statusInfo = statusInfoMap.get(row.status_id);
      const entity = this.mapper.mapToEntity(
        row,
        certificateTypeName,
        paymentTypeName,
        tags,
        statusInfo,
      );

      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar certidão';
      this.logger.error('Erro crítico ao buscar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Lista certidões com filtros
   */
  async findAll(options: ListCertificatesOptions): Promise<Result<PaginatedCertificates>> {
    try {
      const searchValue = options.search
        ? CertificateSearchHelper.normalizeSearchValue(options.search)
        : '';
      const searchTypeIds = searchValue
        ? await this.typeResolver.findTypeIdsBySearch(searchValue)
        : [];

      // Se filtrar por status (nome), resolve o ID primeiro
      let statusIdFilter: string | undefined;
      if (options.status) {
        const statusIdResult = await this.statusResolver.resolveStatusId(options.status);
        if (statusIdResult.success) {
          statusIdFilter = statusIdResult.data;
        }
      }

      // Inicia query base
      let query = this.supabaseClient.from('certificates').select('*', { count: 'exact' });

      // Aplica filtros
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.from) {
        query = query.gte('created_at', options.from);
      }

      if (options.to) {
        query = query.lte('created_at', options.to);
      }

      if (statusIdFilter) {
        query = query.eq('status_id', statusIdFilter);
      }

      if (options.priority) {
        const priorityValue = options.priority === 'urgent' ? 2 : 1;
        query = query.eq('priority', priorityValue);
      }

      if (searchValue) {
        const searchConditions = [
          `record_number.ilike.%${searchValue}%`,
          `order_number.ilike.%${searchValue}%`,
        ];

        const arraySearchValue = CertificateSearchHelper.formatArraySearchValue(searchValue);
        searchConditions.push(`party_names.cs.{${arraySearchValue}}`);

        if (searchTypeIds.length > 0) {
          searchConditions.push(`certificate_type_id.in.(${searchTypeIds.join(',')})`);
        }

        query = query.or(searchConditions.join(','));
      }

      // Aplica paginação
      const limit = options.limit ?? 50;
      const offset = options.offset ?? 0;

      query = query.range(offset, offset + limit - 1);
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar certidões', { error: error.message });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typedDataList = (data ?? []) as Tables<'certificates'>[];
      const rows = typedDataList.map((row) => this.mapDatabaseRowToCertificateRow(row));
      const certificateIds = rows.map((row) => row.id);
      const typeIds = this.extractTypeIds(rows);
      const paymentTypeIds = this.extractPaymentTypeIds(rows);
      const statusIds = this.extractStatusIds(rows);
      const typeNameMap = await this.typeResolver.fetchTypeNameMap(typeIds);
      const paymentTypeNameMap = await this.fetchPaymentTypeNameMap(paymentTypeIds);
      const statusInfoMap = await this.statusResolver.fetchStatusInfoMap(statusIds);
      const tagsMap = await this.fetchTagsMap(certificateIds);

      const entities = this.mapper.mapManyToEntities(
        rows,
        typeNameMap,
        paymentTypeNameMap,
        tagsMap,
        statusInfoMap,
      );

      return success({
        data: entities,
        total: count ?? 0,
        limit,
        offset,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao listar certidões';
      this.logger.error('Erro crítico ao listar certidões', { error: errorMessage });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Atualiza uma certidão
   */
  async update(id: string, data: UpdateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      const updateResult = await this.buildUpdateData(data);

      if (!updateResult.success) {
        return failure(updateResult.error);
      }

      const updateData = updateResult.data;

      const { data: updatedData, error } = await this.supabaseClient
        .from('certificates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !updatedData) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao atualizar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typedUpdatedData = updatedData as Tables<'certificates'>;
      const row = this.mapDatabaseRowToCertificateRow(typedUpdatedData);
      const typeNameMap = await this.typeResolver.fetchTypeNameMap(
        row.certificate_type_id ? [row.certificate_type_id] : [],
      );
      const paymentTypeNameMap = await this.fetchPaymentTypeNameMap(
        row.payment_type_id ? [row.payment_type_id] : [],
      );
      const statusInfoMap = await this.statusResolver.fetchStatusInfoMap([row.status_id]);
      const tagsMap = await this.fetchTagsMap([id]);
      const tags = tagsMap.get(id) ?? [];

      const certificateTypeName = this.mapper.resolveCertificateTypeName(row, typeNameMap);
      const paymentTypeName = this.mapper.resolvePaymentTypeName(row, paymentTypeNameMap);
      const statusInfo = statusInfoMap.get(row.status_id);
      const entity = this.mapper.mapToEntity(
        row,
        certificateTypeName,
        paymentTypeName,
        tags,
        statusInfo,
      );

      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar certidão';
      this.logger.error('Erro crítico ao atualizar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Remove uma certidão
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient.from('certificates').delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao deletar certidão', { error: error.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar certidão';
      this.logger.error('Erro crítico ao deletar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Mapeia linha do banco tipada para CertificateRow (compatibilidade com mapper)
   */
  private mapDatabaseRowToCertificateRow(row: Tables<'certificates'>): CertificateRow {
    return {
      id: row.id,
      user_id: row.user_id,
      certificate_type_id: row.certificate_type_id ?? undefined,
      record_number: row.record_number,
      party_names: row.party_names ?? undefined,
      observations: row.observations,
      priority: row.priority,
      status_id: row.status_id,
      cost: row.cost,
      additional_cost: row.additional_cost,
      order_number: row.order_number,
      payment_type_id: row.payment_type_id ?? undefined,
      payment_date: row.payment_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Constrói objeto para inserção no banco
   */
  private buildInsertData(
    data: CreateCertificateData,
    certificateTypeId: string,
    statusId: string,
  ): TablesInsert<'certificates'> {
    return {
      user_id: data.userId,
      certificate_type_id: certificateTypeId,
      record_number: data.recordNumber,
      party_names: data.partiesName ? [data.partiesName] : null,
      observations: data.notes ?? null,
      priority: this.mapper.mapPriorityToDb(data.priority ?? 'normal'),
      payment_type_id: data.paymentTypeId ?? null,
      status_id: statusId,
    };
  }

  /**
   * Constrói objeto para atualização no banco
   */
  private async buildUpdateData(
    data: UpdateCertificateData,
  ): Promise<Result<TablesUpdate<'certificates'>>> {
    const updateData: TablesUpdate<'certificates'> = {};

    if (data.certificateType !== undefined) {
      const trimmedType = data.certificateType.trim();
      if (trimmedType) {
        const typeIdResult = await this.typeResolver.resolveTypeId(trimmedType);

        if (!typeIdResult.success) {
          return failure(typeIdResult.error);
        }

        updateData.certificate_type_id = typeIdResult.data;
      }
    }

    if (data.recordNumber !== undefined) {
      updateData.record_number = data.recordNumber;
    }

    if (data.partiesName !== undefined) {
      updateData.party_names = data.partiesName ? [data.partiesName] : null;
    }

    if (data.notes !== undefined) {
      updateData.observations = data.notes;
    }

    if (data.priority !== undefined) {
      updateData.priority = this.mapper.mapPriorityToDb(data.priority);
    }

    if (data.status !== undefined) {
      const statusIdResult = await this.statusResolver.resolveStatusId(data.status);
      if (statusIdResult.success) {
        updateData.status_id = statusIdResult.data;
      }
    }

    if (data.cost !== undefined) {
      updateData.cost = data.cost;
    }

    if (data.additionalCost !== undefined) {
      updateData.additional_cost = data.additionalCost;
    }

    if (data.orderNumber !== undefined) {
      updateData.order_number = data.orderNumber;
    }

    if (data.paymentDate !== undefined) {
      updateData.payment_date = data.paymentDate.toISOString().split('T')[0];
    }

    if (data.paymentTypeId !== undefined) {
      const paymentTypeId =
        data.paymentTypeId && data.paymentTypeId.trim() !== '' ? data.paymentTypeId : null;
      updateData.payment_type_id = paymentTypeId;
    }

    return success(updateData);
  }

  /**
   * Extrai IDs de tipo das linhas
   */
  private extractTypeIds(rows: CertificateRow[]): string[] {
    return rows
      .map((row) => row.certificate_type_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Extrai IDs de tipos de pagamento
   */
  private extractPaymentTypeIds(rows: CertificateRow[]): string[] {
    return rows
      .map((row) => row.payment_type_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Extrai IDs de status
   */
  private extractStatusIds(rows: CertificateRow[]): string[] {
    return [...new Set(rows.map((row) => row.status_id))];
  }

  /**
   * Busca mapa id->nome de tipos de pagamento
   */
  private async fetchPaymentTypeNameMap(ids: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (ids.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseClient
      .from('payment_type')
      .select('id, name')
      .in('id', ids);

    if (error) {
      this.logger.error('Erro ao buscar nomes de tipos de pagamento', { error: error.message });
      return map;
    }

    (data ?? []).forEach((row) => {
      const typedRow = row as Tables<'payment_type'>;
      if (typedRow.id && typedRow.name) {
        map.set(typedRow.id, typedRow.name);
      }
    });

    return map;
  }

  /**
   * Busca mapa de tags por IDs de certificados
   * Retorna um Map onde a chave é o ID do certificado e o valor é um array de tags
   */
  private async fetchTagsMap(certificateIds: string[]): Promise<Map<string, CertificateTagData[]>> {
    const map = new Map<string, CertificateTagData[]>();
    if (certificateIds.length === 0) {
      return map;
    }

    // Busca as associações e as tags relacionadas
    const { data, error } = await this.supabaseClient
      .from('certificate_tag_assignments')
      .select(
        `
        certificate_id,
        certificate_tags (
          id,
          name,
          color
        )
      `,
      )
      .in('certificate_id', certificateIds);

    if (error) {
      this.logger.error('Erro ao buscar tags dos certificados', { error: error.message });
      return map;
    }

    // Agrupa as tags por certificado
    (data ?? []).forEach((row) => {
      const certificateId = row.certificate_id;
      const tagData = row.certificate_tags as {
        id: string;
        name: string;
        color: string | null;
      } | null;

      if (!tagData) {
        return;
      }

      const tag: CertificateTagData = {
        id: tagData.id,
        name: tagData.name,
        color: tagData.color,
      };

      const existingTags = map.get(certificateId) ?? [];
      existingTags.push(tag);
      map.set(certificateId, existingTags);
    });

    return map;
  }
}
