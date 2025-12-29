import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { TypedSupabaseClient } from '../../../supabase/4-infrastructure/di/supabase.providers';
import type { Tables } from '../../../supabase/1-domain/types/database.types';
import type {
  ReportRepositoryContract,
  ReportFilters,
  ReportMetrics,
  PaginatedReportCertificates,
  ReportPaginationParams,
  ReportCertificateData,
  StatusBreakdown,
  TypeBreakdown,
  PeriodBreakdown,
  PriorityBreakdown,
} from '../../1-domain/contracts/report.repository.contract';

/**
 * Erros específicos do repositório de relatórios
 */
export const ReportRepositoryError = {
  METRICS_FAILED: 'Não foi possível gerar métricas do relatório',
  LIST_FAILED: 'Não foi possível listar certidões do relatório',
  DATABASE_ERROR: 'Erro ao acessar banco de dados para relatório',
} as const;

/**
 * Mapeamento de prioridade do banco para string
 */
const PRIORITY_FROM_DB: Record<number, 'normal' | 'urgent'> = {
  1: 'normal',
  2: 'urgent',
};

/**
 * Tipo interno para row de certidão com relacionamentos
 */
interface CertificateRowWithRelations {
  id: string;
  certificate_type_id: string | null;
  record_number: string;
  party_names: string[] | null;
  status_id: string;
  cost: number | null;
  additional_cost: number | null;
  payment_date: string | null;
  created_at: string;
  priority: number | null;
}

interface FilterableQuery<T> {
  eq: (column: string, value: string) => T;
  ilike: (column: string, pattern: string) => T;
  gte: (column: string, value: string) => T;
  lte: (column: string, value: string) => T;
  in: (column: string, values: string[]) => T;
  contains: (column: string, value: string[] | Record<string, unknown>) => T;
  order: (column: string, options?: { ascending?: boolean }) => T;
  range: (from: number, to: number) => T;
}

/**
 * Implementação do repositório de relatórios usando Supabase
 * Fornece operações de consulta e agregação para relatórios administrativos
 */
export class SupabaseReportRepository implements ReportRepositoryContract {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly logger: LoggerContract,
  ) {
    this.logger.debug('Repositório de relatórios inicializado');
  }

  async getMetrics(filters: ReportFilters): Promise<Result<ReportMetrics>> {
    try {
      // Busca todas as certidões que atendem aos filtros
      const certificatesResult = await this.fetchFilteredCertificates(filters);

      if (!certificatesResult.success) {
        return failure(certificatesResult.error);
      }

      const certificates = certificatesResult.data;

      // Busca mapas de referência para enriquecer os dados
      const [statusMap, typeMap] = await Promise.all([this.fetchStatusMap(), this.fetchTypeMap()]);

      // Calcula as métricas agregadas
      const metrics = this.calculateMetrics(certificates, statusMap, typeMap);

      return success(metrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao gerar métricas do relatório', { error: errorMessage });
      return failure(ReportRepositoryError.METRICS_FAILED);
    }
  }

  async getCertificates(
    filters: ReportFilters,
    pagination: ReportPaginationParams,
  ): Promise<Result<PaginatedReportCertificates>> {
    try {
      // Constrói a query base
      let query = this.supabase.from('certificates').select('*', { count: 'exact' });

      // Aplica os filtros ANTES de order e range
      query = this.applyFilters(query, filters);

      // Aplica ordenação e paginação DEPOIS dos filtros
      query = query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar certidões do relatório', { error: error.message });
        return failure(ReportRepositoryError.LIST_FAILED);
      }

      const rows = (data ?? []) as Tables<'certificates'>[];

      // Busca mapas de referência
      const [statusMap, typeMap] = await Promise.all([this.fetchStatusMap(), this.fetchTypeMap()]);

      // Mapeia para o formato de resposta
      const certificates: ReportCertificateData[] = rows.map((row) =>
        this.mapCertificateRow(row, statusMap, typeMap),
      );

      return success({
        data: certificates,
        total: count ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar certidões do relatório', { error: errorMessage });
      return failure(ReportRepositoryError.LIST_FAILED);
    }
  }

  /**
   * Busca todas as certidões filtradas (sem paginação para agregações)
   */
  private async fetchFilteredCertificates(
    filters: ReportFilters,
  ): Promise<Result<CertificateRowWithRelations[]>> {
    try {
      let query = this.supabase
        .from('certificates')
        .select(
          'id, certificate_type_id, record_number, party_names, status_id, cost, additional_cost, payment_date, created_at, priority',
        );

      // Aplica os filtros
      query = this.applyFilters(query, filters);

      const { data, error } = await query;

      if (error) {
        this.logger.error('Erro ao buscar certidões para métricas', { error: error.message });
        return failure(ReportRepositoryError.DATABASE_ERROR);
      }

      return success((data ?? []) as CertificateRowWithRelations[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar certidões filtradas', { error: errorMessage });
      return failure(ReportRepositoryError.DATABASE_ERROR);
    }
  }

  /**
   * Aplica os filtros à query do Supabase
   */
  private applyFilters<T extends FilterableQuery<T>>(query: T, filters: ReportFilters): T {
    // Filtros padrão
    if (filters.certificateTypeId) {
      query = query.eq('certificate_type_id', filters.certificateTypeId);
    }

    if (filters.recordNumber) {
      query = query.ilike('record_number', `%${filters.recordNumber}%`);
    }

    if (filters.statusId) {
      query = query.eq('status_id', filters.statusId);
    }

    if (filters.paymentTypeId) {
      query = query.eq('payment_type_id', filters.paymentTypeId);
    }

    if (filters.paymentDateFrom) {
      query = query.gte('payment_date', filters.paymentDateFrom.toISOString().split('T')[0]);
    }

    if (filters.paymentDateTo) {
      query = query.lte('payment_date', filters.paymentDateTo.toISOString().split('T')[0]);
    }

    // Filtros opcionais
    if (filters.orderNumber) {
      query = query.ilike('order_number', `%${filters.orderNumber}%`);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.notesSearch) {
      query = query.ilike('observations', `%${filters.notesSearch}%`);
    }

    if (filters.partiesNameSearch) {
      // Busca em array usando contains (PostgreSQL)
      query = query.contains('party_names', [filters.partiesNameSearch]);
    }

    // tagIds e commentSearch requerem JOINs especiais
    // Por enquanto, implementamos apenas os filtros diretos
    // TODO: Implementar filtro por tags e comentários com subqueries

    return query;
  }

  /**
   * Busca mapa de status para enriquecer dados
   */
  private async fetchStatusMap(): Promise<Map<string, Tables<'certificate_status'>>> {
    const { data } = await this.supabase.from('certificate_status').select('*');

    const map = new Map<string, Tables<'certificate_status'>>();
    const statuses = (data ?? []) as Tables<'certificate_status'>[];
    statuses.forEach((status) => {
      map.set(status.id, status);
    });

    return map;
  }

  /**
   * Busca mapa de tipos de certidão para enriquecer dados
   */
  private async fetchTypeMap(): Promise<Map<string, Tables<'certificates_type'>>> {
    const { data } = await this.supabase.from('certificates_type').select('*');

    const map = new Map<string, Tables<'certificates_type'>>();
    const types = (data ?? []) as Tables<'certificates_type'>[];
    types.forEach((type) => {
      map.set(type.id, type);
    });

    return map;
  }

  /**
   * Calcula as métricas agregadas a partir dos dados
   */
  private calculateMetrics(
    certificates: CertificateRowWithRelations[],
    statusMap: Map<string, Tables<'certificate_status'>>,
    typeMap: Map<string, Tables<'certificates_type'>>,
  ): ReportMetrics {
    // Totais
    let totalCost = 0;
    let totalAdditionalCost = 0;

    // Agregações por categoria
    const byStatusMap = new Map<string, { count: number; totalCost: number }>();
    const byTypeMap = new Map<string, { count: number; totalCost: number }>();
    const byPeriodMap = new Map<string, { count: number; totalCost: number }>();
    const byPriorityMap = new Map<'normal' | 'urgent', number>();

    byPriorityMap.set('normal', 0);
    byPriorityMap.set('urgent', 0);

    for (const cert of certificates) {
      const cost = cert.cost ?? 0;
      const additionalCost = cert.additional_cost ?? 0;

      totalCost += cost;
      totalAdditionalCost += additionalCost;

      // Por status
      const statusAgg = byStatusMap.get(cert.status_id) ?? { count: 0, totalCost: 0 };
      statusAgg.count += 1;
      statusAgg.totalCost += cost + additionalCost;
      byStatusMap.set(cert.status_id, statusAgg);

      // Por tipo
      if (cert.certificate_type_id) {
        const typeAgg = byTypeMap.get(cert.certificate_type_id) ?? { count: 0, totalCost: 0 };
        typeAgg.count += 1;
        typeAgg.totalCost += cost + additionalCost;
        byTypeMap.set(cert.certificate_type_id, typeAgg);
      }

      // Por período (YYYY-MM)
      const period = cert.created_at.substring(0, 7);
      const periodAgg = byPeriodMap.get(period) ?? { count: 0, totalCost: 0 };
      periodAgg.count += 1;
      periodAgg.totalCost += cost + additionalCost;
      byPeriodMap.set(period, periodAgg);

      // Por prioridade
      const priority = PRIORITY_FROM_DB[cert.priority ?? 1] ?? 'normal';
      byPriorityMap.set(priority, (byPriorityMap.get(priority) ?? 0) + 1);
    }

    // Monta a resposta enriquecida
    const byStatus: StatusBreakdown[] = [];
    for (const [statusId, agg] of byStatusMap) {
      const status = statusMap.get(statusId);
      byStatus.push({
        statusId,
        statusName: status?.name ?? 'Desconhecido',
        statusDisplayName: status?.display_name ?? 'Desconhecido',
        statusColor: status?.color ?? '#gray',
        count: agg.count,
        totalCost: agg.totalCost,
      });
    }

    const byType: TypeBreakdown[] = [];
    for (const [typeId, agg] of byTypeMap) {
      const type = typeMap.get(typeId);
      byType.push({
        typeId,
        typeName: type?.name ?? 'Desconhecido',
        count: agg.count,
        totalCost: agg.totalCost,
      });
    }

    const byPeriod: PeriodBreakdown[] = [];
    for (const [period, agg] of byPeriodMap) {
      byPeriod.push({
        period,
        count: agg.count,
        totalCost: agg.totalCost,
      });
    }
    // Ordena por período
    byPeriod.sort((a, b) => a.period.localeCompare(b.period));

    const byPriority: PriorityBreakdown[] = [
      { priority: 'normal', count: byPriorityMap.get('normal') ?? 0 },
      { priority: 'urgent', count: byPriorityMap.get('urgent') ?? 0 },
    ];

    return {
      totalCertificates: certificates.length,
      totalCost,
      totalAdditionalCost,
      totalCombined: totalCost + totalAdditionalCost,
      byStatus,
      byType,
      byPeriod,
      byPriority,
    };
  }

  /**
   * Mapeia uma row do banco para ReportCertificateData
   */
  private mapCertificateRow(
    row: Tables<'certificates'>,
    statusMap: Map<string, Tables<'certificate_status'>>,
    typeMap: Map<string, Tables<'certificates_type'>>,
  ): ReportCertificateData {
    const status = statusMap.get(row.status_id);
    const type = row.certificate_type_id ? typeMap.get(row.certificate_type_id) : null;

    return {
      id: row.id,
      certificateType: type?.name ?? 'Desconhecido',
      recordNumber: row.record_number,
      partiesName: row.party_names?.join(', ') ?? '',
      statusId: row.status_id,
      statusName: status?.name ?? 'Desconhecido',
      statusDisplayName: status?.display_name ?? 'Desconhecido',
      statusColor: status?.color ?? '#gray',
      cost: row.cost,
      additionalCost: row.additional_cost,
      paymentDate: row.payment_date,
      createdAt: row.created_at,
    };
  }
}
