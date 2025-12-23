import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../../shared/1-domain/contracts/logger.contract';
import { CertificateError } from '../../../1-domain/errors/certificate-errors.enum';
import {
  CERTIFICATE_TYPE_TABLES,
  type CertificateTypeRow,
} from '../types/certificate-row.types';

/**
 * Serviço responsável por resolver IDs de tipos de certidão
 * Encapsula a lógica de busca em múltiplas tabelas possíveis
 *
 * Nota: Usa SupabaseClient genérico pois precisa acessar tabelas dinâmicas
 * que podem não estar no schema tipado (suporte a migrações legadas)
 */
export class CertificateTypeResolver {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Resolve o ID do tipo de certidão pelo nome
   * Tenta encontrar em diferentes tabelas e cria se não existir
   * @param certificateType - Nome do tipo de certidão
   * @returns ID do tipo ou erro
   */
  async resolveTypeId(certificateType: string): Promise<Result<string>> {
    const normalizedType = certificateType.trim();

    for (const table of CERTIFICATE_TYPE_TABLES) {
      const findResult = await this.findTypeInTable(table, normalizedType);

      if (findResult.found) {
        return success(findResult.id);
      }

      if (findResult.error) {
        if (this.isMissingRelationError(findResult.error)) {
          continue;
        }
        return failure(CertificateError.DATABASE_ERROR);
      }

      // Tipo não encontrado, tenta criar
      const createResult = await this.createTypeInTable(table, normalizedType);

      if (createResult.created) {
        return success(createResult.id);
      }

      if (createResult.error && this.isMissingRelationError(createResult.error)) {
        continue;
      }

      if (createResult.error) {
        return failure(CertificateError.DATABASE_ERROR);
      }
    }

    this.logger.error('Tabela de tipos de certidão não encontrada', {
      certificateType: normalizedType,
    });

    return failure(CertificateError.INVALID_CERTIFICATE_TYPE);
  }

  /**
   * Busca nomes de tipos de certidão por IDs
   * @param ids - Lista de IDs para buscar
   * @returns Mapa de ID -> Nome
   */
  async fetchTypeNameMap(ids: string[]): Promise<Map<string, string>> {
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
   * Busca IDs de tipos que correspondem a um termo de busca
   * @param search - Termo de busca
   * @returns Lista de IDs encontrados
   */
  async findTypeIdsBySearch(search: string): Promise<string[]> {
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

  /**
   * Tenta encontrar tipo em uma tabela específica
   */
  private async findTypeInTable(
    table: string,
    typeName: string,
  ): Promise<{ found: boolean; id: string; error?: string }> {
    const { data, error } = await this.supabaseClient
      .from(table)
      .select('id')
      .ilike('name', typeName)
      .maybeSingle<CertificateTypeRow>();

    if (error) {
      this.logger.error('Erro ao buscar tipo de certidão', {
        error: error.message,
        certificateType: typeName,
        table,
      });
      return { found: false, id: '', error: error.message };
    }

    if (data) {
      return { found: true, id: data.id };
    }

    return { found: false, id: '' };
  }

  /**
   * Tenta criar tipo em uma tabela específica
   */
  private async createTypeInTable(
    table: string,
    typeName: string,
  ): Promise<{ created: boolean; id: string; error?: string }> {
    const { data, error } = await this.supabaseClient
      .from(table)
      .insert({ name: typeName })
      .select('id')
      .single<CertificateTypeRow>();

    if (error) {
      this.logger.error('Erro ao criar tipo de certidão', {
        error: error.message,
        certificateType: typeName,
        table,
      });
      return { created: false, id: '', error: error.message };
    }

    if (data) {
      return { created: true, id: data.id };
    }

    return { created: false, id: '' };
  }

  /**
   * Verifica se erro é por tabela não existir
   */
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
}
