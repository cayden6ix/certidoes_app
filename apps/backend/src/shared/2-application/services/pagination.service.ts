/**
 * Interface para parâmetros de paginação da query (formato legado)
 */
export interface LegacyPaginationQuery {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

/**
 * Interface para parâmetros de paginação normalizados
 */
export interface NormalizedPagination {
  limit: number;
  offset: number;
}

/**
 * Configuração padrão de paginação
 */
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Serviço responsável por normalizar parâmetros de paginação
 * Suporta tanto formato page/pageSize quanto limit/offset
 */
export class PaginationService {
  /**
   * Normaliza parâmetros de paginação para formato limit/offset
   * Suporta múltiplos formatos de entrada:
   * - page + pageSize (formato página)
   * - limit + offset (formato direto)
   * - Combinações híbridas
   *
   * @param query - Parâmetros de paginação da query
   * @returns Parâmetros normalizados com limit e offset
   */
  static normalize(query: LegacyPaginationQuery): NormalizedPagination {
    const pageSize = this.resolvePageSize(query);
    const { limit, offset } = this.resolveLimitOffset(query, pageSize);

    return { limit, offset };
  }

  /**
   * Resolve o tamanho da página considerando todas as fontes possíveis
   */
  private static resolvePageSize(query: LegacyPaginationQuery): number {
    const rawPageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;

    // Aplica limite máximo para evitar queries muito grandes
    return Math.min(rawPageSize, MAX_PAGE_SIZE);
  }

  /**
   * Resolve limit e offset baseado nos parâmetros fornecidos
   */
  private static resolveLimitOffset(
    query: LegacyPaginationQuery,
    pageSize: number,
  ): NormalizedPagination {
    // Se page foi fornecido, calcula baseado em página
    if (query.page !== undefined) {
      const page = Math.max(1, query.page);
      return {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
    }

    // Se pageSize foi fornecido mas não page, assume página 1
    if (query.pageSize !== undefined) {
      return {
        limit: pageSize,
        offset: 0,
      };
    }

    // Caso contrário, usa limit/offset diretamente
    return {
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
      offset: query.offset ?? 0,
    };
  }

  /**
   * Calcula informações de paginação para resposta
   */
  static calculatePageInfo(
    total: number,
    limit: number,
    offset: number,
  ): {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
