import { useEffect, useState } from 'react';

import { Layout } from '../components/Layout';
import { checkApiHealth, type HealthResponse } from '../lib/api';

/**
 * Página de Dashboard (placeholder)
 * Exibe status da API conforme Sprint 1
 */
export function DashboardPage(): JSX.Element {
  const [apiStatus, setApiStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async (): Promise<void> => {
      try {
        const result = await checkApiHealth();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setApiStatus(result.data);
        } else {
          setError('Resposta vazia da API');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao conectar com API';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchHealth();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Card de Status da API */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Status da API</h2>

          {loading && (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
              <span className="text-gray-500">Verificando conexão...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>API offline: {error}</span>
            </div>
          )}

          {apiStatus && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">API ok</span>
              </div>
              <div className="text-sm text-gray-500">
                <p>Ambiente: {apiStatus.env}</p>
                <p>Última verificação: {new Date(apiStatus.timestamp).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cards placeholder para métricas futuras */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Total de Certidões</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
            <p className="mt-1 text-xs text-gray-400">Será implementado na Sprint 3</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Pendentes</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">--</p>
            <p className="mt-1 text-xs text-gray-400">Será implementado na Sprint 3</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Concluídas</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">--</p>
            <p className="mt-1 text-xs text-gray-400">Será implementado na Sprint 3</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
