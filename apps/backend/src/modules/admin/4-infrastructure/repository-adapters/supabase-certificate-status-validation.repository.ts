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
  CertificateStatusValidationRepositoryContract,
  CertificateStatusValidationData,
  ListStatusValidationsParams,
  PaginatedStatusValidations,
  CreateStatusValidationParams,
  UpdateStatusValidationParams,
} from '../../1-domain/contracts/certificate-status-validation.repository.contract';

/**
 * Erros específicos do repositório de validações por status
 */
export const CertificateStatusValidationRepositoryError = {
  LIST_FAILED: 'Não foi possível listar as validações do status',
  EXISTS_CHECK_FAILED: 'Não foi possível verificar o vínculo de validação',
  CREATE_FAILED: 'Não foi possível criar o vínculo de validação',
  UPDATE_FAILED: 'Não foi possível atualizar o vínculo de validação',
  REMOVE_FAILED: 'Não foi possível remover o vínculo de validação',
} as const;

/**
 * Tipo para linha do banco com relacionamentos
 */
type StatusValidationRowWithRelations = Tables<'certificate_status_validations'> & {
  certificate_status: { id: string; name: string } | null;
  validations: { id: string; name: string; description: string | null } | null;
};

/**
 * Query SELECT com relacionamentos
 */
const SELECT_WITH_RELATIONS = `
  *,
  certificate_status (
    id,
    name
  ),
  validations (
    id,
    name,
    description
  )
`;

/**
 * Implementação do repositório de validações por status usando Supabase
 */
export class SupabaseCertificateStatusValidationRepository implements CertificateStatusValidationRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async list(params: ListStatusValidationsParams): Promise<Result<PaginatedStatusValidations>> {
    try {
      let query = this.supabase
        .from('certificate_status_validations')
        .select(SELECT_WITH_RELATIONS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (params.statusId) {
        query = query.eq('status_id', params.statusId);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar validações por status', { error: error.message });
        return failure(CertificateStatusValidationRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as StatusValidationRowWithRelations[];

      return success({
        data: rows.map((row) => this.mapRule(row)),
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar validações por status', { error: errorMessage });
      return failure(CertificateStatusValidationRepositoryError.LIST_FAILED);
    }
  }

  async existsBinding(
    statusId: string,
    validationId: string,
    requiredField: string | null,
  ): Promise<Result<boolean>> {
    try {
      let query = this.supabase
        .from('certificate_status_validations')
        .select('id')
        .eq('status_id', statusId)
        .eq('validation_id', validationId);

      if (requiredField === null) {
        query = query.is('required_field', null);
      } else {
        query = query.eq('required_field', requiredField);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        this.logger.error('Erro ao verificar vínculo existente', { error: error.message });
        return failure(CertificateStatusValidationRepositoryError.EXISTS_CHECK_FAILED);
      }

      return success(data !== null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao verificar vínculo existente', { error: errorMessage });
      return failure(CertificateStatusValidationRepositoryError.EXISTS_CHECK_FAILED);
    }
  }

  async create(
    params: CreateStatusValidationParams,
  ): Promise<Result<CertificateStatusValidationData>> {
    try {
      const insertData: TablesInsert<'certificate_status_validations'> = {
        status_id: params.statusId,
        validation_id: params.validationId,
        required_field: params.requiredField ?? null,
        confirmation_text: params.confirmationText ?? null,
      };

      const { data, error } = await this.supabase
        .from('certificate_status_validations')
        .insert(insertData)
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (error || !data) {
        this.logger.error('Erro ao criar validação por status', { error: error?.message });
        return failure(CertificateStatusValidationRepositoryError.CREATE_FAILED);
      }

      return success(this.mapRule(data as StatusValidationRowWithRelations));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar validação por status', { error: errorMessage });
      return failure(CertificateStatusValidationRepositoryError.CREATE_FAILED);
    }
  }

  async update(
    id: string,
    params: UpdateStatusValidationParams,
  ): Promise<Result<CertificateStatusValidationData>> {
    try {
      const updateData: TablesUpdate<'certificate_status_validations'> = {};

      if (params.statusId !== undefined) updateData.status_id = params.statusId;
      if (params.validationId !== undefined) updateData.validation_id = params.validationId;
      if (params.requiredField !== undefined) updateData.required_field = params.requiredField;
      if (params.confirmationText !== undefined)
        updateData.confirmation_text = params.confirmationText;

      const { data, error } = await this.supabase
        .from('certificate_status_validations')
        .update(updateData)
        .eq('id', id)
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (error || !data) {
        this.logger.error('Erro ao atualizar validação por status', { error: error?.message, id });
        return failure(CertificateStatusValidationRepositoryError.UPDATE_FAILED);
      }

      return success(this.mapRule(data as StatusValidationRowWithRelations));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar validação por status', {
        error: errorMessage,
        id,
      });
      return failure(CertificateStatusValidationRepositoryError.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('certificate_status_validations')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error('Erro ao remover validação por status', { error: error.message, id });
        return failure(CertificateStatusValidationRepositoryError.REMOVE_FAILED);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao remover validação por status', {
        error: errorMessage,
        id,
      });
      return failure(CertificateStatusValidationRepositoryError.REMOVE_FAILED);
    }
  }

  /**
   * Mapeia uma linha do banco para o tipo CertificateStatusValidationData
   */
  private mapRule(row: StatusValidationRowWithRelations): CertificateStatusValidationData {
    return {
      id: row.id,
      statusId: row.status_id,
      statusName: row.certificate_status?.name ?? '',
      validationId: row.validation_id,
      validationName: row.validations?.name ?? '',
      validationDescription: row.validations?.description ?? null,
      requiredField: row.required_field,
      confirmationText: row.confirmation_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
