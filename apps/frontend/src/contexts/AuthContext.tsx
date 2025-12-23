import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, type AuthUser } from '../lib/api';

/**
 * Chaves utilizadas no localStorage para persistência de sessão
 */
const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'user',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Funções utilitárias para acessar localStorage
 */
function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  /** Usuário autenticado ou null se não estiver logado */
  user: AuthUser | null;
  /** Token de acesso JWT */
  token: string | null;
  /** Indica se está verificando a sessão no carregamento */
  isLoading: boolean;
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  /** Realiza login com email e senha */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Realiza logout do usuário */
  logout: () => Promise<void>;
  /** Limpa dados de autenticação (para uso em caso de erro 401) */
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação
 * Gerencia estado global de autenticação com persistência no localStorage
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  // Inicializa estado diretamente do localStorage - sem loading async
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const navigate = useNavigate();

  // Calcula isAuthenticated
  const isAuthenticated = !!user && !!token;

  /**
   * Limpa dados de autenticação do localStorage e do estado
   */
  const clearAuthData = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    setUser(null);
    setToken(null);
  }, []);

  /**
   * Realiza login com email e senha
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const response = await apiLoginUser(email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (!response.data) {
        return { success: false, error: 'Erro ao fazer login' };
      }

      // Armazena no localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.accessToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
      if (response.data.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
      }

      // Atualiza estado
      setUser(response.data.user);
      setToken(response.data.accessToken);

      // Redireciona baseado no role
      const targetPath = response.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      void navigate(targetPath, { replace: true });

      return { success: true };
    },
    [navigate],
  );

  /**
   * Realiza logout do usuário
   */
  const logout = useCallback(async (): Promise<void> => {
    const currentToken = token ?? getStoredToken();

    if (currentToken) {
      // Tenta fazer logout no backend (ignora erros)
      await apiLogoutUser(currentToken).catch(() => {
        // Ignora erros do backend - logout local sempre ocorre
      });
    }

    clearAuthData();
    void navigate('/login', { replace: true });
  }, [token, clearAuthData, navigate]);

  const value: AuthContextType = {
    user,
    token,
    isLoading: false,
    isAuthenticated,
    login,
    logout,
    clearAuth: clearAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acessar o contexto de autenticação
 * Deve ser usado dentro de um AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
