/**
 * Resultado da autenticação
 */
export interface AuthenticationResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'client' | 'admin';
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

/**
 * Resultado do refresh token
 */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Contrato para serviço de autenticação
 * Define operações de autenticação com provedor externo (Supabase)
 */
export interface AuthServiceContract {
  /**
   * Autentica usuário com email e senha
   */
  signInWithPassword(email: string, password: string): Promise<AuthenticationResult>;

  /**
   * Renova token de acesso usando refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<RefreshResult>;

  /**
   * Verifica se um token JWT é válido
   */
  verifyToken(token: string): Promise<{ userId: string; email: string; role: string }>;

  /**
   * Realiza logout
   */
  signOut(accessToken: string): Promise<void>;
}
