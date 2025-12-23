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
          const errorData = (await response.json()) as { message?: string | string[] };
          // Trata array de mensagens de validação (class-validator retorna array)
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message[0] ?? errorMessage;
          } else {
            errorMessage = errorData.message ?? errorMessage;
          }
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

/**
 * Tipos de autenticação
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'client' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  role: 'client' | 'admin';
}

/**
 * Faz login com email e senha
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Faz logout do usuário
 */
export async function logoutUser(token: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Obtém dados do usuário autenticado
 */
export async function getCurrentUser(token: string): Promise<ApiResponse<CurrentUserResponse>> {
  return apiClient<CurrentUserResponse>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============ CERTIFICATES API ============

/**
 * Tipos de certidão
 */
export interface Certificate {
  id: string;
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'canceled';
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCertificates {
  data: Certificate[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateCertificateRequest {
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes?: string;
  priority?: 'normal' | 'urgent';
}

export interface UpdateCertificateRequest {
  certificateType?: string;
  recordNumber?: string;
  partiesName?: string;
  notes?: string;
  priority?: 'normal' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'canceled';
  cost?: number;
  additionalCost?: number;
  orderNumber?: string;
  paymentDate?: string;
}

export interface ListCertificatesParams {
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

/**
 * Cria uma nova certidão
 */
export async function createCertificate(
  token: string,
  data: CreateCertificateRequest,
): Promise<ApiResponse<Certificate>> {
  return apiClient<Certificate>('/certificates', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Lista certidões com filtros opcionais
 */
export async function listCertificates(
  token: string,
  params?: ListCertificatesParams,
): Promise<ApiResponse<PaginatedCertificates>> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/certificates?${queryString}` : '/certificates';

  return apiClient<PaginatedCertificates>(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Obtém uma certidão específica
 */
export async function getCertificate(
  token: string,
  id: string,
): Promise<ApiResponse<Certificate>> {
  return apiClient<Certificate>(`/certificates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Atualiza uma certidão
 */
export async function updateCertificate(
  token: string,
  id: string,
  data: UpdateCertificateRequest,
): Promise<ApiResponse<Certificate>> {
  return apiClient<Certificate>(`/certificates/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
