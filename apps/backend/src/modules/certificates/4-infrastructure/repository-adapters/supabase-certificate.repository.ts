import type { SupabaseClient } from '@supabase/supabase-js';
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
import { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import {
  CertificateStatusValueObject,
  type CertificateStatusType,
} from '../../1-domain/value-objects/certificate-status.value-object';
import {
  CertificatePriorityValueObject,
  type CertificatePriorityType,
} from '../../1-domain/value-objects/certificate-priority.value-object';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

/**
 * Interface para tipagem da linha de certificate do banco
 */
interface CertificateRow {
  id: string;
  user_id: string;
  certificate_type?: string;
  certificate_type_id?: string;
  record_number: string;
  parties_name?: string | string[];
  parties_names?: string | string[];
  party_names?: string | string[];
  notes?: string | null;
  observations?: string | null;
  priority?: 'normal' | 'urgent' | number | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'canceled';
  cost?: number | null;
  additional_cost?: number | null;
  order_number?: string | null;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface CertificateTypeRow {
  id: string;
  name: string;
}

const CERTIFICATE_TYPE_TABLES = ['certificate_types', 'certificates_type'] as const;
const PRIORITY_TO_DB: Record<CertificatePriorityType, number> = {
  normal: 1,
  urgent: 2,
};
const DEFAULT_STATUS: CertificateStatusType = 'pending';

/**
 * Implementação de repositório de certidões com Supabase
 * Usa serviceRoleKey para bypass de RLS (controle de permissões no backend)
 */
export class SupabaseCertificateRepository implements CertificateRepositoryContract {
  private supabaseClient: SupabaseClient;

  constructor(
    supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.supabaseClient = supabaseClient;
    this.logger.debug('Repositório de certidões Supabase inicializado');
  }

  /**
   * Cria uma nova certidão
   */
  async create(data: CreateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      const certificateTypeIdResult = await this.resolveCertificateTypeId(data.certificateType);
      if (!certificateTypeIdResult.success) {
        return failure(certificateTypeIdResult.error);
      }

      const insertData: Record<string, unknown> = {
        user_id: data.userId,
        certificate_type_id: certificateTypeIdResult.data,
        record_number: data.recordNumber,
        party_names: data.partiesName,
        observations: data.notes ?? null,
        priority: this.mapPriorityToDb(data.priority ?? 'normal'),
      };

      let { data: insertedData, error } = await this.supabaseClient
        .from('certificates')
        .insert(insertData)
        .select()
        .single<CertificateRow>();

      if (error && this.isArrayLiteralError(error.message) && typeof insertData['party_names'] === 'string') {
        insertData['party_names'] = this.formatPartyNames(insertData['party_names']);
        ({ data: insertedData, error } = await this.supabaseClient
          .from('certificates')
          .insert(insertData)
          .select()
          .single<CertificateRow>());
      }

      if (error || !insertedData) {
        this.logger.error('Erro ao criar certidão no banco', {
          error: error?.message,
          userId: data.userId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const entity = this.mapToEntity(insertedData, data.certificateType);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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
        .single<CertificateRow>();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao buscar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typeNameMap = await this.fetchCertificateTypeNameMap(
        data.certificate_type_id ? [data.certificate_type_id] : [],
      );
      const certificateTypeName = this.resolveCertificateTypeName(data, typeNameMap);
      const entity = this.mapToEntity(data, certificateTypeName);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Lista certidões com filtros
   */
  async findAll(options: ListCertificatesOptions): Promise<Result<PaginatedCertificates>> {
    try {
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
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.priority) {
        const priorityValue = options.priority === 'urgent' ? 'urgent' : 'normal';
        query = query.eq('priority', this.mapPriorityToDb(priorityValue));
      }
      if (options.search) {
        const searchValue = this.normalizeSearchValue(options.search);
        if (searchValue) {
          const typeIds = await this.findCertificateTypeIdsBySearch(searchValue);
          const searchConditions = [
            `record_number.ilike.%${searchValue}%`,
            `party_names.cs.{${this.formatArraySearchValue(searchValue)}}`,
          ];

          if (typeIds.length > 0) {
            searchConditions.push(`certificate_type_id.in.(${typeIds.join(',')})`);
          }

          query = query.or(searchConditions.join(','));
        }
      }

      // Aplica paginação
      const limit = options.limit ?? 50;
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      // Ordena por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar certidões', { error: error.message });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const rows = data as CertificateRow[];
      const typeIds = rows
        .map((row) => row.certificate_type_id)
        .filter((value): value is string => Boolean(value));
      const typeNameMap = await this.fetchCertificateTypeNameMap(typeIds);

      const entities = rows
        .map((row) => this.mapToEntity(row, this.resolveCertificateTypeName(row, typeNameMap)))
        .filter((entity): entity is CertificateEntity => entity !== null);

      return success({
        data: entities,
        total: count ?? 0,
        limit,
        offset,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar certidões', { error: errorMessage });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Atualiza uma certidão
   */
  async update(id: string, data: UpdateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      // Monta objeto de atualização com nomes de colunas do banco
      const updateData: Record<string, unknown> = {};
      let partyNamesValue: string | string[] | undefined;

      if (data.certificateType !== undefined) {
        const certificateTypeIdResult = await this.resolveCertificateTypeId(data.certificateType);
        if (!certificateTypeIdResult.success) {
          return failure(certificateTypeIdResult.error);
        }
        updateData['certificate_type_id'] = certificateTypeIdResult.data;
      }
      if (data.recordNumber !== undefined) {
        updateData['record_number'] = data.recordNumber;
      }
      if (data.partiesName !== undefined) {
        partyNamesValue = data.partiesName;
        updateData['party_names'] = partyNamesValue;
      }
      if (data.notes !== undefined) {
        updateData['observations'] = data.notes;
      }
      if (data.priority !== undefined) {
        updateData['priority'] = this.mapPriorityToDb(data.priority);
      }
      if (data.status !== undefined) {
        updateData['status'] = data.status;
      }
      if (data.cost !== undefined) {
        updateData['cost'] = data.cost;
      }
      if (data.additionalCost !== undefined) {
        updateData['additional_cost'] = data.additionalCost;
      }
      if (data.orderNumber !== undefined) {
        updateData['order_number'] = data.orderNumber;
      }
      if (data.paymentDate !== undefined) {
        updateData['payment_date'] = data.paymentDate.toISOString().split('T')[0];
      }

      let { data: updatedData, error } = await this.supabaseClient
        .from('certificates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single<CertificateRow>();

      if (
        error &&
        this.isArrayLiteralError(error.message) &&
        typeof partyNamesValue === 'string'
      ) {
        updateData['party_names'] = this.formatPartyNames(partyNamesValue);
        ({ data: updatedData, error } = await this.supabaseClient
          .from('certificates')
          .update(updateData)
          .eq('id', id)
          .select()
          .single<CertificateRow>());
      }

      if (error || !updatedData) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao atualizar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const typeNameMap = await this.fetchCertificateTypeNameMap(
        updatedData.certificate_type_id ? [updatedData.certificate_type_id] : [],
      );
      const certificateTypeName = this.resolveCertificateTypeName(updatedData, typeNameMap);
      const entity = this.mapToEntity(updatedData, certificateTypeName);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao deletar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Resolve o ID do tipo de certidão pelo nome
   */
  private async resolveCertificateTypeId(
    certificateType: string,
  ): Promise<Result<string>> {
    const normalizedType = certificateType.trim();

    for (const table of CERTIFICATE_TYPE_TABLES) {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('id')
        .ilike('name', normalizedType)
        .maybeSingle<CertificateTypeRow>();

      if (error) {
        if (this.isMissingRelationError(error.message)) {
          continue;
        }
        this.logger.error('Erro ao buscar tipo de certidão', {
          error: error.message,
          certificateType: normalizedType,
          table,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      if (data) {
        return success(data.id);
      }

      const { data: insertedData, error: insertError } = await this.supabaseClient
        .from(table)
        .insert({ name: normalizedType })
        .select('id')
        .single<CertificateTypeRow>();

      if (insertError || !insertedData) {
        if (insertError && this.isMissingRelationError(insertError.message)) {
          continue;
        }
        this.logger.error('Erro ao criar tipo de certidão', {
          error: insertError?.message,
          certificateType: normalizedType,
          table,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(insertedData.id);
    }

    this.logger.error('Tabela de tipos de certidão não encontrada', {
      certificateType: normalizedType,
    });
    return failure(CertificateError.INVALID_CERTIFICATE_TYPE);
  }

  /**
   * Busca nomes de tipos de certidão por IDs
   */
  private async fetchCertificateTypeNameMap(
    ids: string[],
  ): Promise<Map<string, string>> {
    if (ids.length === 0) {
      return new Map();
    }

    for (const table of CERTIFICATE_TYPE_TABLES) {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('id,name')
        .in('id', ids);

      if (error) {
        if (this.isMissingRelationError(error.message)) {
          continue;
        }
        this.logger.error('Erro ao buscar tipos de certidão', {
          error: error.message,
          table,
        });
        return new Map();
      }

      const map = new Map<string, string>();
      (data as CertificateTypeRow[]).forEach((row) => {
        map.set(row.id, row.name);
      });

      return map;
    }

    return new Map();
  }

  /**
   * Resolve o nome do tipo de certidão para uso no DTO
   */
  private resolveCertificateTypeName(
    row: CertificateRow,
    typeNameMap: Map<string, string>,
  ): string {
    if (row.certificate_type) {
      return row.certificate_type;
    }

    if (row.certificate_type_id) {
      return typeNameMap.get(row.certificate_type_id) ?? row.certificate_type_id;
    }

    return '';
  }

  private mapPriorityToDb(priority: CertificatePriorityType): number {
    return PRIORITY_TO_DB[priority] ?? PRIORITY_TO_DB.normal;
  }

  private mapPriorityFromDb(
    priority: CertificateRow['priority'],
  ): CertificatePriorityType {
    if (priority === 'urgent' || priority === 'normal') {
      return priority;
    }

    if (typeof priority === 'number') {
      return priority >= PRIORITY_TO_DB.urgent ? 'urgent' : 'normal';
    }

    return 'normal';
  }

  private resolvePartiesName(row: CertificateRow): string {
    const value = row.parties_name ?? row.parties_names ?? row.party_names;
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value;
  }

  private resolveNotes(row: CertificateRow): string | null {
    return row.notes ?? row.observations ?? null;
  }

  private normalizeSearchValue(value: string): string {
    return value.replace(/[{},()]/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private formatArraySearchValue(value: string): string {
    const escaped = value.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  private async findCertificateTypeIdsBySearch(search: string): Promise<string[]> {
    const queryValue = `%${search}%`;

    for (const table of CERTIFICATE_TYPE_TABLES) {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('id')
        .ilike('name', queryValue);

      if (error) {
        if (this.isMissingRelationError(error.message)) {
          continue;
        }

        this.logger.error('Erro ao buscar tipos de certidão para pesquisa', {
          error: error.message,
          search,
          table,
        });
        return [];
      }

      const rows = data as CertificateTypeRow[];
      if (rows && rows.length > 0) {
        return rows.map((row) => row.id);
      }
    }

    return [];
  }

  private formatPartyNames(value: unknown): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value
      .split(/[,;\n]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  private isArrayLiteralError(message?: string): boolean {
    if (!message) {
      return false;
    }

    const normalized = message.toLowerCase();
    return normalized.includes('array literal') || normalized.includes('array');
  }

  private isMissingRelationError(message?: string): boolean {
    if (!message) {
      return false;
    }

    const normalized = message.toLowerCase();
    return (
      normalized.includes('schema cache') ||
      normalized.includes('relation') ||
      normalized.includes('does not exist')
    );
  }

  /**
   * Mapeia row do banco para entidade de domínio
   */
  private mapToEntity(
    row: CertificateRow,
    certificateTypeName?: string,
  ): CertificateEntity | null {
    try {
      const statusValue = row.status ?? DEFAULT_STATUS;
      const statusResult = CertificateStatusValueObject.create(statusValue);
      if (!statusResult.success) {
        this.logger.error('Status inválido no banco', { status: statusValue, id: row.id });
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
        certificateType:
          certificateTypeName ?? this.resolveCertificateTypeName(row, new Map()),
        recordNumber: row.record_number,
        partiesName: this.resolvePartiesName(row),
        notes: this.resolveNotes(row),
        priority: priorityResult.data,
        status: statusResult.data,
        cost: row.cost ?? null,
        additionalCost: row.additional_cost ?? null,
        orderNumber: row.order_number ?? null,
        paymentDate: row.payment_date ? new Date(row.payment_date) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao mapear certidão para entidade', {
        error: errorMessage,
        id: row.id,
      });
      return null;
    }
  }
}
