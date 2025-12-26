import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import type {
  CertificateTypeRepositoryContract,
  CertificateTypeData,
  ListCertificateTypesParams,
  PaginatedCertificateTypes,
  CreateCertificateTypeParams,
  UpdateCertificateTypeParams,
} from '../../1-domain/contracts/certificate-type.repository.contract';

/**
 * Erros específicos do repositório de tipos de certidão
 */
export const CertificateTypeRepositoryError = {
  LIST_FAILED: 'Não foi possível listar os tipos de certidão',
  CREATE_FAILED: 'Não foi possível criar o tipo de certidão',
  UPDATE_FAILED: 'Não foi possível atualizar o tipo de certidão',
  REMOVE_FAILED: 'Não foi possível remover o tipo de certidão',
} as const;

/**
 * Nome da tabela de tipos de certidão no banco
 */
const CERTIFICATE_TYPE_TABLE = 'certificates_type' as const;

type CertificateTypeRow = Tables<'certificates_type'>;

/**
 * Implementação do repositório de tipos de certidão usando Supabase
 */
export class SupabaseCertificateTypeRepository implements CertificateTypeRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListCertificateTypesParams): Promise<Result<PaginatedCertificateTypes>> {
    try {
      const searchValue = params.search?.trim();

      let query = this.supabase
        .from(CERTIFICATE_TYPE_TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (searchValue) {
        query = query.ilike('name', `%${searchValue}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar tipos de certidão', { error: error.message });
        return failure(CertificateTypeRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as CertificateTypeRow[];

      return success({
        data: rows.map((row) => this.mapCertificateType(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar tipos de certidão', { error: errorMessage });
      return failure(CertificateTypeRepositoryError.LIST_FAILED);
    }
  }

  async create(params: CreateCertificateTypeParams): Promise<Result<CertificateTypeData>> {
    try {
      const insertData: TablesInsert<'certificates_type'> = {
        name: params.name,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from(CERTIFICATE_TYPE_TABLE)
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao criar tipo de certidão', { error: error?.message });
        return failure(CertificateTypeRepositoryError.CREATE_FAILED);
      }

      return success(this.mapCertificateType(data as CertificateTypeRow));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar tipo de certidão', { error: errorMessage });
      return failure(CertificateTypeRepositoryError.CREATE_FAILED);
    }
  }

  async update(
    id: string,
    params: UpdateCertificateTypeParams,
  ): Promise<Result<CertificateTypeData>> {
    try {
      const updateData: TablesUpdate<'certificates_type'> = {};

      if (params.name !== undefined) updateData.name = params.name;

      const { data, error } = await this.supabase
        .from(CERTIFICATE_TYPE_TABLE)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        this.logger.error('Erro ao atualizar tipo de certidão', { error: error?.message, id });
        return failure(CertificateTypeRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapCertificateType(data as CertificateTypeRow));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar tipo de certidão', { error: errorMessage, id });
      return failure(CertificateTypeRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.from(CERTIFICATE_TYPE_TABLE).delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao remover tipo de certidão', { error: error.message, id });
        return failure(CertificateTypeRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover tipo de certidão', { error: errorMessage, id });
      return failure(CertificateTypeRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo CertificateTypeData
   */
  private mapCertificateType(row: CertificateTypeRow): CertificateTypeData {
    const genericRow = row as Record<string, unknown>;

    return {
      id: row.id,
      name: row.name,
      description: (genericRow.description as string | null | undefined) ?? null,
      isActive:
        (genericRow.is_active as boolean | null | undefined) ??
        (genericRow.active as boolean | null | undefined) ??
        true,
      createdAt: row.created_at,
    };
  }
}
