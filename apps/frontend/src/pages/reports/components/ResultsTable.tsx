import { Link } from 'react-router-dom';
import { formatCentsToBRL } from '@certidoes/shared';
import { formatDate } from '../../../lib/date-format';
import type { PaginatedReportCertificates } from '../../../lib/api';

interface ResultsTableProps {
  data: PaginatedReportCertificates | null;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Calcula a cor de contraste para texto baseado na cor de fundo
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1f2937' : '#ffffff';
}

/**
 * Tabela de resultados paginada
 */
export function ResultsTable({
  data,
  loading,
  page,
  pageSize,
  onPageChange,
}: ResultsTableProps): JSX.Element {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <span className="ml-3 text-gray-500">Carregando certidões...</span>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          Nenhuma certidão encontrada com os filtros aplicados
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / pageSize);

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ficha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Partes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Custo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Custas Adicionais
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.data.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {cert.certificateType}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {cert.recordNumber}
                </td>
                <td
                  className="max-w-xs truncate px-6 py-4 text-sm text-gray-500"
                  title={cert.partiesName}
                >
                  {cert.partiesName}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: cert.statusColor,
                      color: getContrastColor(cert.statusColor),
                    }}
                  >
                    {cert.statusDisplayName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {cert.cost !== null ? formatCentsToBRL(cert.cost) : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {cert.additionalCost !== null ? formatCentsToBRL(cert.additionalCost) : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(cert.createdAt)}
                </td>
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

      {/* Paginação */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{data.data.length}</span> de{' '}
          <span className="font-medium">{data.total.toLocaleString('pt-BR')}</span> resultados
        </p>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
