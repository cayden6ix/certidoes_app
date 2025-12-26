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
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
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

    if (response.status === 204) {
      return { data: null as T, error: null };
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
 * Representa uma tag associada a uma certidão
 */
export interface CertificateTagInfo {
  id: string;
  name: string;
  color: string | null;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateType: string;
  recordNumber: string;
  partiesName: string;
  notes: string | null;
  priority: 'normal' | 'urgent';
  status: CertificateStatusInfo;
  cost: number | null;
  additionalCost: number | null;
  orderNumber: string | null;
  paymentTypeId: string | null;
  paymentType: string | null;
  paymentDate: string | null;
  tags: CertificateTagInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CertificateEvent {
  id: string;
  certificateId: string;
  actorUserId: string;
  actorRole: 'client' | 'admin';
  eventType: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
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
  status?: string;
  cost?: number;
  additionalCost?: number;
  orderNumber?: string;
  paymentDate?: string;
  paymentTypeId?: string | null;
  validationConfirmed?: boolean;
  validationStatement?: string;
}

export interface ListCertificatesParams {
  search?: string;
  from?: string;
  to?: string;
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface ListCertificateTypesParams {
  search?: string;
  page?: number;
  pageSize?: number;
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

  if (params?.search) queryParams.append('search', params.search);
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
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

export async function listCertificateTypes(
  token: string,
  params?: ListCertificateTypesParams,
): Promise<ApiResponse<PaginatedResult<CertificateCatalogType>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/certificates/types?${queryString}` : '/certificates/types';

  return apiClient<PaginatedResult<CertificateCatalogType>>(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Obtém uma certidão específica
 */
export async function getCertificate(token: string, id: string): Promise<ApiResponse<Certificate>> {
  return apiClient<Certificate>(`/certificates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lista eventos de uma certidão
 */
export async function listCertificateEvents(
  token: string,
  id: string,
): Promise<ApiResponse<CertificateEvent[]>> {
  return apiClient<CertificateEvent[]>(`/certificates/${id}/events`, {
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

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'client' | 'admin';
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface CertificateCatalogType {
  id: string;
  name: string;
  description: string | null;
  isActive?: boolean | null;
  createdAt: string;
}

export interface CertificateTag {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CertificateStatusInfo {
  id: string;
  name: string;
  displayName: string;
  color: string;
  canEditCertificate: boolean;
  isFinal: boolean;
}

export interface CertificateStatusConfig extends CertificateStatusInfo {
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface ValidationConfig {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateStatusValidationRule {
  id: string;
  statusId: string;
  statusName: string;
  validationId: string;
  validationName: string;
  validationDescription: string | null;
  requiredField: string | null;
  confirmationText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListAdminParams {
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

// ============ ADMIN API ============

export interface CreateAdminUserRequest {
  fullName: string;
  email: string;
  password: string;
  role?: 'client' | 'admin';
}

export interface UpdateAdminUserRequest {
  fullName?: string;
  email?: string;
  password?: string;
  role?: 'client' | 'admin';
}

export async function listAdminUsers(
  token: string,
  params?: ListAdminParams,
): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';

  return apiClient<PaginatedResult<AdminUser>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminUser(
  token: string,
  payload: CreateAdminUserRequest,
): Promise<ApiResponse<AdminUser>> {
  return apiClient<AdminUser>('/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  token: string,
  id: string,
  payload: UpdateAdminUserRequest,
): Promise<ApiResponse<AdminUser>> {
  return apiClient<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(token: string, id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface CreatePaymentTypeRequest {
  name: string;
  description?: string | null;
  enabled?: boolean;
}

export type UpdatePaymentTypeRequest = CreatePaymentTypeRequest;

export async function listPaymentTypes(
  token: string,
  params?: ListAdminParams,
): Promise<ApiResponse<PaginatedResult<PaymentType>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/admin/payment-types?${queryString}` : '/admin/payment-types';

  return apiClient<PaginatedResult<PaymentType>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createPaymentType(
  token: string,
  payload: CreatePaymentTypeRequest,
): Promise<ApiResponse<PaymentType>> {
  return apiClient<PaymentType>('/admin/payment-types', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updatePaymentType(
  token: string,
  id: string,
  payload: UpdatePaymentTypeRequest,
): Promise<ApiResponse<PaymentType>> {
  return apiClient<PaymentType>(`/admin/payment-types/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deletePaymentType(token: string, id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/payment-types/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface CreateCertificateTypeRequest {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateCertificateTypeRequest = CreateCertificateTypeRequest;

export async function listCertificateTypesAdmin(
  token: string,
  params?: ListAdminParams,
): Promise<ApiResponse<PaginatedResult<CertificateCatalogType>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/admin/certificate-types?${queryString}`
    : '/admin/certificate-types';

  return apiClient<PaginatedResult<CertificateCatalogType>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCertificateType(
  token: string,
  payload: CreateCertificateTypeRequest,
): Promise<ApiResponse<CertificateCatalogType>> {
  return apiClient<CertificateCatalogType>('/admin/certificate-types', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateCertificateType(
  token: string,
  id: string,
  payload: UpdateCertificateTypeRequest,
): Promise<ApiResponse<CertificateCatalogType>> {
  return apiClient<CertificateCatalogType>(`/admin/certificate-types/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificateType(token: string, id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/certificate-types/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface CreateTagRequest {
  name: string;
  description?: string | null;
  color?: string | null;
}

export type UpdateTagRequest = CreateTagRequest;

export async function listCertificateTags(
  token: string,
  params?: ListAdminParams,
): Promise<ApiResponse<PaginatedResult<CertificateTag>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/admin/certificate-tags?${queryString}`
    : '/admin/certificate-tags';

  return apiClient<PaginatedResult<CertificateTag>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCertificateTag(
  token: string,
  payload: CreateTagRequest,
): Promise<ApiResponse<CertificateTag>> {
  return apiClient<CertificateTag>('/admin/certificate-tags', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateCertificateTag(
  token: string,
  id: string,
  payload: UpdateTagRequest,
): Promise<ApiResponse<CertificateTag>> {
  return apiClient<CertificateTag>(`/admin/certificate-tags/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificateTag(token: string, id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/certificate-tags/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Atualiza as tags de um certificado específico
 */
export async function updateCertificateTags(
  token: string,
  certificateId: string,
  tagIds: string[],
): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient<{ success: boolean }>(`/admin/certificate-tags/certificates/${certificateId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tagIds }),
  });
}

// ============ CERTIFICATE STATUS API ============

export interface ListStatusParams {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface CreateCertificateStatusRequest {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  canEditCertificate?: boolean;
  isFinal?: boolean;
}

export type UpdateCertificateStatusRequest = Partial<CreateCertificateStatusRequest> & {
  isActive?: boolean;
};

export interface ListValidationsParams {
  search?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateValidationRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateValidationRequest = Partial<CreateValidationRequest>;

export interface ListStatusValidationParams {
  statusId?: string;
  limit?: number;
  offset?: number;
}

export interface CreateStatusValidationRequest {
  statusId: string;
  validationId: string;
  requiredField?: string | null;
  confirmationText?: string | null;
}

export type UpdateStatusValidationRequest = Partial<CreateStatusValidationRequest>;

export async function listCertificateStatuses(
  token: string,
  params?: ListStatusParams,
): Promise<ApiResponse<PaginatedResult<CertificateStatusConfig>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeInactive !== undefined)
    queryParams.append('includeInactive', String(params.includeInactive));
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/admin/certificate-statuses?${queryString}`
    : '/admin/certificate-statuses';

  return apiClient<PaginatedResult<CertificateStatusConfig>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCertificateStatus(
  token: string,
  payload: CreateCertificateStatusRequest,
): Promise<ApiResponse<CertificateStatusConfig>> {
  return apiClient<CertificateStatusConfig>('/admin/certificate-statuses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateCertificateStatus(
  token: string,
  id: string,
  payload: UpdateCertificateStatusRequest,
): Promise<ApiResponse<CertificateStatusConfig>> {
  return apiClient<CertificateStatusConfig>(`/admin/certificate-statuses/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificateStatus(
  token: string,
  id: string,
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/certificate-statuses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ VALIDATIONS API ============

export async function listValidations(
  token: string,
  params?: ListValidationsParams,
): Promise<ApiResponse<PaginatedResult<ValidationConfig>>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeInactive !== undefined)
    queryParams.append('includeInactive', String(params.includeInactive));
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/admin/validations?${queryString}` : '/admin/validations';

  return apiClient<PaginatedResult<ValidationConfig>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createValidation(
  token: string,
  payload: CreateValidationRequest,
): Promise<ApiResponse<ValidationConfig>> {
  return apiClient<ValidationConfig>('/admin/validations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateValidation(
  token: string,
  id: string,
  payload: UpdateValidationRequest,
): Promise<ApiResponse<ValidationConfig>> {
  return apiClient<ValidationConfig>(`/admin/validations/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteValidation(token: string, id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/validations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ====== CERTIFICATE STATUS VALIDATIONS API ======

export async function listCertificateStatusValidations(
  token: string,
  params?: ListStatusValidationParams,
): Promise<ApiResponse<PaginatedResult<CertificateStatusValidationRule>>> {
  const queryParams = new URLSearchParams();
  if (params?.statusId) queryParams.append('statusId', params.statusId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/admin/certificate-status-validations?${queryString}`
    : '/admin/certificate-status-validations';

  return apiClient<PaginatedResult<CertificateStatusValidationRule>>(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCertificateStatusValidation(
  token: string,
  payload: CreateStatusValidationRequest,
): Promise<ApiResponse<CertificateStatusValidationRule>> {
  return apiClient<CertificateStatusValidationRule>('/admin/certificate-status-validations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateCertificateStatusValidation(
  token: string,
  id: string,
  payload: UpdateStatusValidationRequest,
): Promise<ApiResponse<CertificateStatusValidationRule>> {
  return apiClient<CertificateStatusValidationRule>(`/admin/certificate-status-validations/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificateStatusValidation(
  token: string,
  id: string,
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/certificate-status-validations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
