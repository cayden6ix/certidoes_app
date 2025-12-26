import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import type {
  CertificateStatusValidationContract,
  StatusValidationRequirement,
} from '../../../1-domain/contracts/certificate-status-validation.contract';

/**
 * Serviço responsável por buscar validações associadas ao status
 */
export class CertificateStatusValidationResolver implements CertificateStatusValidationContract {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  async fetchActiveValidations(statusName: string): Promise<Result<StatusValidationRequirement[]>> {
    const normalizedStatus = statusName.trim().toLowerCase();

    const { data: statusData, error: statusError } = await this.supabaseClient
      .from('certificate_status')
      .select('id')
      .eq('name', normalizedStatus)
      .maybeSingle();

    if (statusError) {
      this.logger.error('Erro ao buscar status para validação', {
        error: statusError.message,
        statusName: normalizedStatus,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }

    if (!statusData) {
      return failure(CertificateError.INVALID_STATUS);
    }

    const statusId = (statusData as { id: string }).id;

    const { data, error } = await this.supabaseClient
      .from('certificate_status_validations')
      .select(
        `
        id,
        required_field,
        confirmation_text,
        validations!inner (
          id,
          name,
          description,
          is_active
        )
      `,
      )
      .eq('status_id', statusId)
      .eq('validations.is_active', true);

    if (error) {
      this.logger.error('Erro ao buscar validações do status', {
        error: error.message,
        statusId,
      });
      return failure(CertificateError.DATABASE_ERROR);
    }

    const rows = (data ?? []) as Array<{
      required_field: string | null;
      confirmation_text: string | null;
      validations:
        | { id: string; name: string; description: string | null; is_active: boolean }
        | Array<{ id: string; name: string; description: string | null; is_active: boolean }>
        | null;
    }>;

    const requirements = rows
      .map((row) => {
        const validation = Array.isArray(row.validations) ? row.validations[0] : row.validations;

        if (!validation) {
          return null;
        }

        return {
          validationId: validation.id,
          validationName: validation.name,
          validationDescription: validation.description ?? null,
          requiredField: row.required_field ?? null,
          confirmationText: row.confirmation_text ?? null,
        };
      })
      .filter((item): item is StatusValidationRequirement => Boolean(item));

    return success(requirements);
  }
}
