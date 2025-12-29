import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { formatCentsToBRL } from '@certidoes/shared';
import type { ReportMetrics } from '../../../lib/api';

interface MetricsDashboardProps {
  metrics: ReportMetrics | null;
  includeAdditionalCost: boolean;
  onIncludeAdditionalCostChange: (value: boolean) => void;
  loading: boolean;
}

/**
 * Formata o período (YYYY-MM) para exibição
 */
function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

/**
 * Card de métrica individual
 */
function MetricCard({
  title,
  value,
  color,
  highlight,
}: {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'indigo';
  highlight?: boolean;
}): JSX.Element {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className={`rounded-lg bg-white p-4 shadow ${highlight ? 'ring-2 ring-indigo-500' : ''}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

/**
 * Dashboard de métricas com gráficos
 */
export function MetricsDashboard({
  metrics,
  includeAdditionalCost,
  onIncludeAdditionalCostChange,
  loading,
}: MetricsDashboardProps): JSX.Element {
  const displayTotal = useMemo(() => {
    if (!metrics) return 0;
    return includeAdditionalCost ? metrics.totalCombined : metrics.totalCost;
  }, [metrics, includeAdditionalCost]);

  // Prepara dados para o gráfico de período
  const periodData = useMemo(() => {
    if (!metrics) return [];
    return metrics.byPeriod.map((p) => ({
      ...p,
      periodLabel: formatPeriod(p.period),
      totalCostFormatted: formatCentsToBRL(p.totalCost),
    }));
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <span className="ml-3 text-gray-500">Calculando métricas...</span>
      </div>
    );
  }

  if (!metrics) {
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          Aplique filtros e clique em "Aplicar Filtros" para visualizar as métricas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Certidões"
          value={metrics.totalCertificates.toLocaleString('pt-BR')}
          color="blue"
        />
        <MetricCard
          title="Soma de Custos"
          value={formatCentsToBRL(metrics.totalCost)}
          color="green"
        />
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Custas Adicionais</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAdditionalCost}
                onChange={(e) => onIncludeAdditionalCostChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500">Incluir na soma</span>
            </label>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600">
            {formatCentsToBRL(metrics.totalAdditionalCost)}
          </p>
        </div>
        <MetricCard
          title="Soma Total"
          value={formatCentsToBRL(displayTotal)}
          color="indigo"
          highlight
        />
      </div>

      {/* Gráficos em grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de pizza - Quebra por Status */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Quebra por Status</h3>
          {metrics.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.byStatus}
                  dataKey="count"
                  nameKey="statusDisplayName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ statusDisplayName, count }) => `${statusDisplayName}: ${count}`}
                >
                  {metrics.byStatus.map((entry) => (
                    <Cell key={entry.statusId} fill={entry.statusColor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} certidões`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Sem dados de status
            </div>
          )}
        </div>

        {/* Gráfico de barras - Quebra por Tipo */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Quebra por Tipo de Certidão</h3>
          {metrics.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="typeName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} certidões`, 'Quantidade']} />
                <Bar dataKey="count" fill="#3b82f6" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Sem dados de tipo
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de linha - Quebra por Período */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Quebra por Período</h3>
        {periodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodLabel" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'Custo Total' ? formatCentsToBRL(value) : value,
                  name,
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                name="Quantidade"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalCost"
                stroke="#10b981"
                name="Custo Total"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            Sem dados de período
          </div>
        )}
      </div>

      {/* Indicadores de prioridade */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Quantidade por Prioridade</h3>
        <div className="flex gap-4">
          {metrics.byPriority.map((p) => (
            <div
              key={p.priority}
              className={`flex-1 rounded-lg p-4 ${
                p.priority === 'urgent' ? 'bg-orange-50' : 'bg-gray-50'
              }`}
            >
              <h4 className="text-sm font-medium text-gray-500">
                {p.priority === 'urgent' ? 'Urgente' : 'Normal'}
              </h4>
              <p
                className={`mt-1 text-2xl font-bold ${
                  p.priority === 'urgent' ? 'text-orange-600' : 'text-gray-900'
                }`}
              >
                {p.count.toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
