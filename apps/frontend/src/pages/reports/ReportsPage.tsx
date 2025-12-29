import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ModularFilters, type FilterValues } from './components/ModularFilters';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ResultsTable } from './components/ResultsTable';
import {
  listCertificateStatuses,
  listCertificateTypesAdmin,
  listPaymentTypes,
  listCertificateTags,
  listAdminUsers,
  getReportMetrics,
  getReportCertificates,
  type CertificateStatusConfig,
  type CertificateCatalogType,
  type PaymentType,
  type CertificateTag,
  type AdminUser,
  type ReportMetrics,
  type PaginatedReportCertificates,
  type ReportFilters,
} from '../../lib/api';

const PAGE_SIZE = 20;

/**
 * Converte os valores de filtro do formulário para o formato da API
 */
function buildApiFilters(values: FilterValues): ReportFilters {
  const filters: ReportFilters = {};

  if (values.certificateType) {
    filters.certificateTypeId = values.certificateType;
  }

  if (values.recordNumber) {
    filters.recordNumber = values.recordNumber;
  }

  if (values.status) {
    filters.statusId = values.status;
  }

  if (values.tags && values.tags.length > 0) {
    filters.tagIds = values.tags;
  }

  if (values.paymentType) {
    filters.paymentTypeId = values.paymentType;
  }

  if (values.paymentDate?.from) {
    filters.paymentDateFrom = values.paymentDate.from;
  }

  if (values.paymentDate?.to) {
    filters.paymentDateTo = values.paymentDate.to;
  }

  if (values.orderNumber) {
    filters.orderNumber = values.orderNumber;
  }

  if (values.user) {
    filters.userId = values.user;
  }

  if (values.commentSearch) {
    filters.commentSearch = values.commentSearch;
  }

  if (values.notes) {
    filters.notesSearch = values.notes;
  }

  if (values.partiesName) {
    filters.partiesNameSearch = values.partiesName;
  }

  return filters;
}

/**
 * Página de Relatórios Administrativos
 * Permite filtrar certidões com filtros modulares e visualizar métricas
 */
export function ReportsPage(): JSX.Element {
  const { token } = useAuth();

  // Estado das opções de filtros
  const [statuses, setStatuses] = useState<CertificateStatusConfig[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateCatalogType[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [tags, setTags] = useState<CertificateTag[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Estado dos filtros selecionados
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Estado dos resultados
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [certificates, setCertificates] = useState<PaginatedReportCertificates | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [certificatesLoading, setCertificatesLoading] = useState(false);

  // Estado de paginação
  const [page, setPage] = useState(1);

  // Estado do checkbox de custas adicionais
  const [includeAdditionalCost, setIncludeAdditionalCost] = useState(true);

  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  // Carrega as opções de filtros ao montar o componente
  useEffect(() => {
    if (!token) return;

    const loadFilterOptions = async () => {
      setOptionsLoading(true);
      const errors: string[] = [];

      // Carrega cada opção independentemente para não quebrar todas se uma falhar
      try {
        const statusesRes = await listCertificateStatuses(token);
        if (statusesRes.data) {
          setStatuses(statusesRes.data.data);
        } else if (statusesRes.error) {
          errors.push(`Status: ${statusesRes.error}`);
        } else {
          errors.push('Status: resposta vazia');
        }
      } catch (err) {
        errors.push(`Status: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      }

      try {
        const typesRes = await listCertificateTypesAdmin(token);
        if (typesRes.data) {
          setCertificateTypes(typesRes.data.data);
        } else if (typesRes.error) {
          errors.push(`Tipos: ${typesRes.error}`);
        } else {
          errors.push('Tipos: resposta vazia');
        }
      } catch (err) {
        errors.push(`Tipos: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      }

      try {
        const paymentRes = await listPaymentTypes(token);
        if (paymentRes.data) {
          setPaymentTypes(paymentRes.data.data);
        } else if (paymentRes.error) {
          errors.push(`Pagamentos: ${paymentRes.error}`);
        } else {
          errors.push('Pagamentos: resposta vazia');
        }
      } catch (err) {
        errors.push(`Pagamentos: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      }

      try {
        const tagsRes = await listCertificateTags(token);
        if (tagsRes.data) {
          setTags(tagsRes.data.data);
        } else if (tagsRes.error) {
          errors.push(`Tags: ${tagsRes.error}`);
        } else {
          errors.push('Tags: resposta vazia');
        }
      } catch (err) {
        errors.push(`Tags: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      }

      try {
        const usersRes = await listAdminUsers(token);
        if (usersRes.data) {
          setUsers(usersRes.data.data);
        } else if (usersRes.error) {
          errors.push(`Usuários: ${usersRes.error}`);
        } else {
          errors.push('Usuários: resposta vazia');
        }
      } catch (err) {
        errors.push(`Usuários: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      }

      if (errors.length > 0) {
        setError(`Erro ao carregar filtros: ${errors.join('; ')}`);
      }

      setOptionsLoading(false);
    };

    void loadFilterOptions();
  }, [token]);

  // Busca os dados quando os filtros são aplicados
  const handleApplyFilters = useCallback(async () => {
    if (!token) return;

    setError(null);
    setMetricsLoading(true);
    setCertificatesLoading(true);
    setPage(1);

    const apiFilters = buildApiFilters(filterValues);

    const errors: string[] = [];

    try {
      const metricsRes = await getReportMetrics(token, apiFilters);
      if (metricsRes.data) {
        setMetrics(metricsRes.data);
      } else {
        errors.push(`Métricas: ${metricsRes.error ?? 'erro desconhecido'}`);
        setMetrics(null);
      }
    } catch (err) {
      errors.push(`Métricas: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }

    try {
      const certificatesRes = await getReportCertificates(token, apiFilters, {
        page: 1,
        pageSize: PAGE_SIZE,
      });
      if (certificatesRes.data) {
        setCertificates(certificatesRes.data);
      } else {
        errors.push(`Certidões: ${certificatesRes.error ?? 'erro desconhecido'}`);
        setCertificates(null);
      }
    } catch (err) {
      errors.push(`Certidões: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      setCertificates(null);
    } finally {
      setCertificatesLoading(false);
    }

    if (errors.length > 0) {
      setError(errors.join('; '));
    }
  }, [token, filterValues]);

  // Busca página específica de certificados
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!token) return;

      setCertificatesLoading(true);
      setError(null);

      const apiFilters = buildApiFilters(filterValues);

      try {
        const certificatesRes = await getReportCertificates(token, apiFilters, {
          page: newPage,
          pageSize: PAGE_SIZE,
        });

        if (certificatesRes.data) {
          setCertificates(certificatesRes.data);
          setPage(newPage);
        } else {
          setError(certificatesRes.error ?? 'Erro ao carregar página');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar página';
        setError(errorMessage);
      } finally {
        setCertificatesLoading(false);
      }
    },
    [token, filterValues],
  );

  // Limpa todos os filtros
  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setMetrics(null);
    setCertificates(null);
    setPage(1);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Visualize métricas e filtre certidões com filtros personalizáveis
          </p>
        </div>

        {/* Mensagem de erro global */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Seção de Filtros */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={metricsLoading || certificatesLoading}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {metricsLoading || certificatesLoading ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Buscando...
                  </span>
                ) : (
                  'Aplicar Filtros'
                )}
              </button>
            </div>
          </div>

          <ModularFilters
            filterValues={filterValues}
            onFilterChange={setFilterValues}
            statuses={statuses}
            certificateTypes={certificateTypes}
            paymentTypes={paymentTypes}
            tags={tags}
            users={users}
            loading={optionsLoading}
          />
        </div>

        {/* Dashboard de Métricas */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Métricas</h2>
          <MetricsDashboard
            metrics={metrics}
            includeAdditionalCost={includeAdditionalCost}
            onIncludeAdditionalCostChange={setIncludeAdditionalCost}
            loading={metricsLoading}
          />
        </div>

        {/* Tabela de Resultados */}
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Certidões</h2>
          <ResultsTable
            data={certificates}
            loading={certificatesLoading}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
