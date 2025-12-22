/**
 * Configuração do cliente HTTP para a API
 * Inclui interceptadores para JWT e renovação automática de token
 */

import { RefreshTokenResponse, Session } from '../types/auth.types';

const API_BASE_URL = '/api';

const STORAGE_KEYS = {
  USER: 'auth:user',
  SESSION: 'auth:session',
} as const;

/**
 * Obtém o token de acesso do localStorage
 */
const getAccessToken = (): string | null => {
  const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionStr) return null;

  try {
    const session: Session = JSON.parse(sessionStr);
    return session.accessToken;
  } catch {
    return null;
  }
};

/**
 * Obtém o refresh token do localStorage
 */
const getRefreshToken = (): string | null => {
  const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionStr) return null;

  try {
    const session: Session = JSON.parse(sessionStr);
    return session.refreshToken;
  } catch {
    return null;
  }
};

/**
 * Atualiza a sessão no localStorage após refresh
 */
const updateSession = (newSession: RefreshTokenResponse): void => {
  const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionStr) return;

  try {
    const session: Session = JSON.parse(sessionStr);
    const updatedSession: Session = {
      ...session,
      accessToken: newSession.accessToken,
      refreshToken: newSession.refreshToken,
      expiresAt: newSession.expiresAt,
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
  }
};

/**
 * Limpa a sessão e redireciona para login
 */
const clearSessionAndRedirect = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Tenta renovar o token usando refresh token
 */
const tryRefreshToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data: RefreshTokenResponse = await response.json();
    updateSession(data);
    return data.accessToken;
  } catch {
    return null;
  }
};

interface ApiConfig extends RequestInit {
  skipAuth?: boolean;
}

interface ApiResponse<T> {
  data: T;
}

/**
 * Cliente HTTP com suporte a JWT e renovação automática
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    config: ApiConfig = {},
  ): Promise<ApiResponse<T>> {
    const { skipAuth, headers, ...restConfig } = config;

    // Adicionar token JWT automaticamente
    let requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (!skipAuth) {
      const token = getAccessToken();
      if (token) {
        requestHeaders = {
          ...requestHeaders,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      let response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: requestHeaders,
        ...restConfig,
      });

      // Se receber 401, tentar renovar token
      if (response.status === 401 && !skipAuth) {
        const newToken = await tryRefreshToken();

        if (newToken) {
          // Tentar novamente com novo token
          requestHeaders = {
            ...requestHeaders,
            Authorization: `Bearer ${newToken}`,
          };

          response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: requestHeaders,
            ...restConfig,
          });
        } else {
          // Falhou ao renovar, limpar sessão e redirecionar
          clearSessionAndRedirect();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

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

        throw new Error(errorMessage);
      }

      // Se a resposta for 204 No Content, retornar objeto vazio
      if (response.status === 204) {
        return { data: {} as T };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Resposta inválida: conteúdo não é JSON');
      }

      const data = (await response.json()) as T;
      return { data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }

  async get<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

/**
 * Instância do cliente API
 */
export const api = new ApiClient(API_BASE_URL);

/**
 * Verifica o status da API
 */
export interface HealthResponse {
  status: string;
  env: string;
  timestamp: string;
}

export async function checkApiHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health', { skipAuth: true });
  return response.data;
}
