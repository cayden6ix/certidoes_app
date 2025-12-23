import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { CertificateCatalogType } from '@shared/types';

import { CERTIFICATE_TYPE_TABLES } from '../../../certificates/4-infrastructure/repository-adapters/types/certificate-row.types';
import { SUPABASE_CLIENT } from '../../../supabase/4-infrastructure/di/supabase.tokens';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../supabase/1-domain/types/database.types';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';

interface ListCertificateTypesParams {
  search?: string;
  limit: number;
  offset: number;
}

interface CreateCertificateTypeParams {
  name: string;
}

interface UpdateCertificateTypeParams {
  name?: string;
}

type CertificateTypeRow = Tables<'certificate_types'> | Tables<'certificates_type'>;

@Injectable()
export class CertificateTypesService {
  private cachedTableName: (typeof CERTIFICATE_TYPE_TABLES)[number] | null = null;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: TypedSupabaseClient,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  async list(
    params: ListCertificateTypesParams,
  ): Promise<{ data: CertificateCatalogType[]; total: number }> {
    const table = await this.resolveTable();
    const searchValue = params.search?.trim();

    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (searchValue) {
      query = query.ilike('name', `%${searchValue}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Erro ao listar tipos de certidão', {
        error: error.message,
        table,
      });
      throw new BadRequestException('Não foi possível listar os tipos de certidão');
    }

    const rows = (data ?? []) as CertificateTypeRow[];

    return {
      data: rows.map((row) => this.mapCertificateType(row)),
      total: count ?? 0,
    };
  }

  async create(params: CreateCertificateTypeParams): Promise<CertificateCatalogType> {
    const table = await this.resolveTable();

    const insertData: TablesInsert<'certificate_types'> = {
      name: params.name,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.from(table).insert(insertData).select('*').single();

    if (error || !data) {
      this.logger.error('Erro ao criar tipo de certidão', { error: error?.message, table });
      throw new BadRequestException('Não foi possível criar o tipo de certidão');
    }

    return this.mapCertificateType(data as CertificateTypeRow);
  }

  async update(id: string, params: UpdateCertificateTypeParams): Promise<CertificateCatalogType> {
    const table = await this.resolveTable();
    const updateData: TablesUpdate<'certificate_types'> = {};

    if (params.name !== undefined) updateData.name = params.name;
    const { data, error } = await this.supabase
      .from(table)
      .update(updateData as TablesUpdate<'certificate_types'>)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error('Erro ao atualizar tipo de certidão', { error: error?.message, id, table });
      throw new BadRequestException('Não foi possível atualizar o tipo de certidão');
    }

    return this.mapCertificateType(data as CertificateTypeRow);
  }

  async remove(id: string): Promise<void> {
    const table = await this.resolveTable();
    const { error } = await this.supabase.from(table).delete().eq('id', id);

    if (error) {
      this.logger.error('Erro ao remover tipo de certidão', { error: error.message, id, table });
      throw new BadRequestException('Não foi possível remover o tipo de certidão');
    }
  }

  private async resolveTable(): Promise<(typeof CERTIFICATE_TYPE_TABLES)[number]> {
    if (this.cachedTableName) {
      return this.cachedTableName;
    }

    for (const table of CERTIFICATE_TYPE_TABLES) {
      const { error } = await this.supabase.from(table).select('id').limit(1);

      if (!error) {
        this.cachedTableName = table;
        return table;
      }

      if (!this.isMissingRelationError(error.message)) {
        this.logger.error('Erro ao tentar resolver tabela de tipos', { error: error.message, table });
        throw new BadRequestException('Erro ao acessar a tabela de tipos de certidão');
      }
    }

    throw new NotFoundException('Tabela de tipos de certidão não encontrada');
  }

  private isMissingRelationError(message: string | undefined): boolean {
    if (!message) {
      return false;
    }

    const normalized = message.toLowerCase();

    return (
      (normalized.includes('relation') && normalized.includes('does not exist')) ||
      normalized.includes('could not find the table') ||
      normalized.includes('schema cache')
    );
  }

  private mapCertificateType(row: CertificateTypeRow): CertificateCatalogType {
    const genericRow = row as Record<string, unknown>;

    return {
      id: genericRow.id as string,
      name: genericRow.name as string,
      description: (genericRow.description as string | null | undefined) ?? null,
      isActive:
        (genericRow.is_active as boolean | null | undefined) ??
        (genericRow.active as boolean | null | undefined) ??
        true,
      createdAt: genericRow.created_at as string,
    };
  }
}
