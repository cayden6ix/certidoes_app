import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import type { CertificateStatusValidationRule } from '@shared/types';

import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListStatusValidationParams {
  statusId?: string;
  limit: number;
  offset: number;
}

interface CreateStatusValidationParams {
  statusId: string;
  validationId: string;
  requiredField?: string | null;
  confirmationText?: string | null;
}

interface UpdateStatusValidationParams {
  statusId?: string;
  validationId?: string;
  requiredField?: string | null;
  confirmationText?: string | null;
}

@Injectable()
export class CertificateStatusValidationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(
    params: ListStatusValidationParams,
  ): Promise<{ data: CertificateStatusValidationRule[]; total: number }> {
    let query = this.supabase
      .from('certificate_status_validations')
      .select(
        `
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
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (params.statusId) {
      query = query.eq('status_id', params.statusId);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Erro ao listar validações por status', { error: error.message });
      throw new BadRequestException('Não foi possível listar as validações do status');
    }

    const rows = (data ?? []) as Array<
      Tables<'certificate_status_validations'> & {
        certificate_status: { id: string; name: string } | null;
        validations: { id: string; name: string; description: string | null } | null;
      }
    >;

    return {
      data: rows.map((row) => this.mapRule(row)),
      total: count ?? 0,
    };
  }

  async create(params: CreateStatusValidationParams): Promise<CertificateStatusValidationRule> {
    let existingQuery = this.supabase
      .from('certificate_status_validations')
      .select('id')
      .eq('status_id', params.statusId)
      .eq('validation_id', params.validationId);

    if (params.requiredField === undefined || params.requiredField === null) {
      existingQuery = existingQuery.is('required_field', null);
    } else {
      existingQuery = existingQuery.eq('required_field', params.requiredField);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      throw new BadRequestException('Já existe esse vínculo de validação para o status');
    }

    const insertData: TablesInsert<'certificate_status_validations'> = {
      status_id: params.statusId,
      validation_id: params.validationId,
      required_field: params.requiredField ?? null,
      confirmation_text: params.confirmationText ?? null,
    };

    const { data, error } = await this.supabase
      .from('certificate_status_validations')
      .insert(insertData)
      .select(
        `
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
      `,
      )
      .single();

    if (error || !data) {
      this.logger.error('Erro ao criar validação por status', { error: error?.message });
      throw new BadRequestException('Não foi possível criar o vínculo de validação');
    }

    return this.mapRule(
      data as Tables<'certificate_status_validations'> & {
        certificate_status: { id: string; name: string } | null;
        validations: { id: string; name: string; description: string | null } | null;
      },
    );
  }

  async update(
    id: string,
    params: UpdateStatusValidationParams,
  ): Promise<CertificateStatusValidationRule> {
    const updateData: TablesUpdate<'certificate_status_validations'> = {};

    if (params.statusId !== undefined) updateData.status_id = params.statusId;
    if (params.validationId !== undefined) updateData.validation_id = params.validationId;
    if (params.requiredField !== undefined) updateData.required_field = params.requiredField;
    if (params.confirmationText !== undefined) {
      updateData.confirmation_text = params.confirmationText;
    }

    const { data, error } = await this.supabase
      .from('certificate_status_validations')
      .update(updateData)
      .eq('id', id)
      .select(
        `
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
      `,
      )
      .single();

    if (error || !data) {
      this.logger.error('Erro ao atualizar validação por status', { error: error?.message, id });
      throw new BadRequestException('Não foi possível atualizar o vínculo de validação');
    }

    return this.mapRule(
      data as Tables<'certificate_status_validations'> & {
        certificate_status: { id: string; name: string } | null;
        validations: { id: string; name: string; description: string | null } | null;
      },
    );
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('certificate_status_validations')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover validação por status', { error: error.message, id });
      throw new BadRequestException('Não foi possível remover o vínculo de validação');
    }
  }

  private mapRule(
    row: Tables<'certificate_status_validations'> & {
      certificate_status: { id: string; name: string } | null;
      validations: { id: string; name: string; description: string | null } | null;
    },
  ): CertificateStatusValidationRule {
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
