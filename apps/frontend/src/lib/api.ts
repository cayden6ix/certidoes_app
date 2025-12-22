/**
 * Configuração do cliente HTTP para a API
 */

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Cliente HTTP para comunicação com o backend
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Erro HTTP: ${response.status}`;

      if (contentType?.includes('application/json')) {
        try {
          const errorData = (await response.json()) as { message?: string };
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usa mensagem padrão
        }
      }

      return {
        data: null,
        error: errorMessage,
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        data: null,
        error: 'Resposta inválida: conteúdo não é JSON',
      };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return { data: null, error: errorMessage };
  }
}

/**
 * Verifica o status da API
 */
export interface HealthResponse {
  status: string;
  env: string;
  timestamp: string;
}

export async function checkApiHealth(): Promise<ApiResponse<HealthResponse>> {
  return apiClient<HealthResponse>('/health');
}
