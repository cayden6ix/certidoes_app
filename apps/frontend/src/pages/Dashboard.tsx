import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { formatCentsToBRL } from '@certidoes/shared';

import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useCertificateSelection } from '../contexts/CertificateSelectionContext';
import {
  listCertificateStatuses,
  listCertificates,
  type Certificate,
  type CertificateStatusConfig,
  type CertificateTagInfo,
  type PaginatedCertificates,
} from '../lib/api';
import { formatDate } from '../lib/date-format';

/**
 * Mapeia prioridade para cores e labels
 */
const PRIORITY_CONFIG: Record<
  Certificate['priority'],
  { label: string; bgColor: string; textColor: string }
> = {
  normal: { label: 'Normal', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  urgent: { label: 'Urgente', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
};

/**
 * Componente de Badge para status/prioridade
 */
function Badge({
  config,
}: {
  config: { label: string; bgColor: string; textColor: string };
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Componente de Badge para tags com cor personalizada
 */
function TagBadge({ tag }: { tag: CertificateTagInfo }): JSX.Element {
  // Se a tag tem cor definida, usa ela; caso contrário, usa cinza como padrão
  const hasCustomColor = tag.color?.startsWith('#');

  if (hasCustomColor) {
    // Calcula cor de texto baseado no brilho da cor de fundo
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 128, g: 128, b: 128 };
    };

    const rgb = hexToRgb(tag.color!);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    const textColor = brightness > 128 ? '#1f2937' : '#ffffff';

    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: tag.color!,
          color: textColor,
        }}
      >
        {tag.name}
      </span>
    );
  }

  // Fallback para cor padrão (cinza)
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {tag.name}
    </span>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1f2937' : '#ffffff';
}

function StatusBadge({ status }: { status: Certificate['status'] }): JSX.Element {
  const bgColor = status.color || '#e5e7eb';
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: bgColor,
        color: getContrastColor(bgColor),
      }}
    >
      {status.displayName}
    </span>
  );
}

/**
 * Conteudo interno do Dashboard
 * Separado para usar o contexto de selecao
 */
function DashboardContent(): JSX.Element {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedCertificates, 'data'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [statuses, setStatuses] = useState<CertificateStatusConfig[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Usa o contexto de selecao
  const { isSelected, toggleSelection, selectAll, clearSelection, selectionCount } =
    useCertificateSelection();

  const fetchCertificates = useCallback(async (): Promise<void> => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const result = await listCertificates(token, {
      search: search.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      status: statusFilter || undefined,
      page,
      pageSize,
    });

    if (result.error) {
      setError(result.error);
      setCertificates([]);
    } else if (result.data) {
      setCertificates(result.data.data);
      setPagination({
        total: result.data.total,
        limit: result.data.limit,
        offset: result.data.offset,
      });
    }

    setLoading(false);
  }, [token, statusFilter, search, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    void fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    let active = true;
    const fetchStatuses = async (): Promise<void> => {
      setLoadingStatuses(true);
      const response = await listCertificateStatuses(token, { includeInactive: true, limit: 100 });

      if (!active) return;

      if (response.error || !response.data) {
        setStatusError(response.error ?? 'Não foi possível carregar os status');
        setStatuses([]);
      } else {
        setStatusError(null);
        setStatuses(response.data.data);
      }

      setLoadingStatuses(false);
    };

    void fetchStatuses();

    return () => {
      active = false;
    };
  }, [token, isAdmin]);

  const statusOptions = useMemo(() => {
    type StatusOption = CertificateStatusConfig & { displayOrder?: number };

    if (isAdmin && statuses.length > 0) {
      return statuses as StatusOption[];
    }

    const map = new Map<string, StatusOption>();
    certificates.forEach((certificate, index) => {
      const status = certificate.status;
      map.set(status.id, {
        ...status,
        description: null,
        displayOrder: index,
        isActive: true,
        createdAt: '',
        createdBy: null,
      });
    });

    return Array.from(map.values());
  }, [certificates, isAdmin, statuses]);

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    certificates.forEach((certificate) => {
      map.set(certificate.status.name, (map.get(certificate.status.name) ?? 0) + 1);
    });
    return map;
  }, [certificates]);

  const sortedStatusCards = useMemo(() => {
    return [...statusOptions].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [statusOptions]);

  const totalCount = pagination?.total ?? 0;

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Painel Administrativo' : 'Minhas Certidões'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin
                ? 'Gerencie todas as solicitações de certidões'
                : 'Acompanhe suas solicitações de certidões'}
            </p>
          </div>
          {!isAdmin && (
            <Link
              to="/request-certificate"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Nova Solicitação
            </Link>
          )}
        </div>

        {/* Barra de selecao - apenas para admin */}
        {isAdmin && selectionCount > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary-700">
                {selectionCount} certidão(ões) selecionada(s)
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-primary-600 hover:text-primary-500 hover:underline"
              >
                Limpar seleção
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/bulk-update')}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Editar em massa
            </button>
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Total de Certidões</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalCount}</p>
          </div>
          {sortedStatusCards.slice(0, 3).map((status) => (
            <div
              key={status.id}
              className="rounded-lg bg-white p-6 shadow"
              style={{ borderTop: `4px solid ${status.color}` }}
            >
              <h3 className="text-sm font-medium text-gray-500">{status.displayName}</h3>
              <p className="mt-2 text-3xl font-bold" style={{ color: status.color || '#111827' }}>
                {statusCounts.get(status.name) ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Ficha, partes ou tipo"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">
              De
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">
              Até
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.displayName}
                </option>
              ))}
            </select>
            {statusError && (
              <p className="mt-1 text-xs text-red-600">
                {loadingStatuses ? 'Carregando status...' : statusError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700">
              Por página
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Lista de Certidões */}
        <div className="rounded-lg bg-white shadow">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-500">Carregando certidões...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="mx-auto h-12 w-12 text-red-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="mt-4 text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void fetchCertificates()}
                className="mt-4 text-sm text-primary-600 hover:text-primary-500"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && certificates.length === 0 && (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhuma certidão encontrada
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {statusFilter
                  ? 'Nenhuma certidão encontrada com este filtro.'
                  : isAdmin
                    ? 'Ainda não há solicitações de certidões.'
                    : 'Comece solicitando sua primeira certidão.'}
              </p>
              {!isAdmin && !statusFilter && (
                <Link
                  to="/request-certificate"
                  className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  Nova Solicitação
                </Link>
              )}
            </div>
          )}

          {!loading && !error && certificates.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Checkbox para selecionar todos - apenas para admin */}
                    {isAdmin && (
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            certificates.length > 0 && certificates.every((c) => isSelected(c.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAll(certificates);
                            } else {
                              clearSelection();
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          title="Selecionar todas as certidões da página"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nº Ficha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Partes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tags
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Custo
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className={`hover:bg-gray-50 ${isAdmin && isSelected(cert.id) ? 'bg-primary-50' : ''}`}
                    >
                      {/* Checkbox de selecao individual - apenas para admin */}
                      {isAdmin && (
                        <td className="w-12 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected(cert.id)}
                            onChange={() => toggleSelection(cert)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {cert.certificateType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {cert.recordNumber}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                        {cert.partiesName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={cert.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge config={PRIORITY_CONFIG[cert.priority]} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(cert.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {cert.tags && cert.tags.length > 0 ? (
                            cert.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatCentsToBRL(cert.cost)}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          to={`/certificates/${cert.id}`}
                          className="text-primary-600 hover:text-primary-500"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {Math.min(certificates.length, pagination.limit)}
                </span>{' '}
                de <span className="font-medium">{pagination.total}</span> resultados
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage((prev) => Math.max(1, prev - 1));
                  }}
                  disabled={page <= 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  disabled={page >= totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/**
 * Página de Dashboard
 * Exibe lista de certidões do usuário/admin
 * Usa o contexto de selecao do App para operacoes em massa
 */
export function DashboardPage(): JSX.Element {
  return <DashboardContent />;
}
