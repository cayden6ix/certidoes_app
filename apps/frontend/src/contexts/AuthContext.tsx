import React, { createContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  Session,
  User,
} from '../types/auth.types';

/**
 * Contexto de autenticação
 * Gerencia estado global de autenticação e persistência
 */

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'auth:user',
  SESSION: 'auth:session',
} as const;

/**
 * Provider de autenticação
 * Gerencia login, logout e persistência em localStorage
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Carrega sessão do localStorage ao iniciar
   */
  useEffect(() => {
    const loadStoredSession = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

        if (storedUser && storedSession) {
          const user: User = JSON.parse(storedUser);
          const session: Session = JSON.parse(storedSession);

          // Verificar se o token não expirou
          const now = Math.floor(Date.now() / 1000);
          if (session.expiresAt > now) {
            setState({
              user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // Token expirado, tentar renovar
          refreshTokenSilent(session.refreshToken);
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        clearStoredSession();
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredSession();
  }, []);

  /**
   * Salva sessão no localStorage
   */
  const saveSession = useCallback((user: User, session: Session) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }, []);

  /**
   * Limpa sessão do localStorage
   */
  const clearStoredSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, []);

  /**
   * Renova token silenciosamente (sem mudar isLoading)
   */
  const refreshTokenSilent = async (refreshTokenValue: string) => {
    try {
      const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken: refreshTokenValue,
      });

      const newSession: Session = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      };

      // Manter o usuário atual, apenas atualizar sessão
      setState((prev) => {
        if (prev.user) {
          saveSession(prev.user, newSession);
          return {
            ...prev,
            session: newSession,
            isAuthenticated: true,
            isLoading: false,
          };
        }
        return { ...prev, isLoading: false };
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      clearStoredSession();
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  /**
   * Realiza login
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await api.post<LoginResponse>('/auth/login', credentials);

        const { user, session } = response.data;

        saveSession(user, session);

        setState({
          user,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        throw error;
      }
    },
    [saveSession],
  );

  /**
   * Realiza logout
   */
  const logout = useCallback(async () => {
    try {
      if (state.session?.accessToken) {
        // Chamar endpoint de logout (best-effort, não bloqueia se falhar)
        await api.post('/auth/logout').catch(() => {
          // Ignorar erro
        });
      }
    } finally {
      clearStoredSession();
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [state.session, clearStoredSession]);

  /**
   * Renova token manualmente
   */
  const refreshToken = useCallback(async () => {
    if (!state.session?.refreshToken) {
      throw new Error('Nenhum refresh token disponível');
    }

    await refreshTokenSilent(state.session.refreshToken);
  }, [state.session]);

  /**
   * Configura renovação automática antes do token expirar
   */
  useEffect(() => {
    if (!state.session || !state.isAuthenticated) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = state.session.expiresAt - now;

    // Renovar 5 minutos antes de expirar
    const refreshTime = Math.max(0, (expiresIn - 300) * 1000);

    const timeoutId = setTimeout(() => {
      refreshTokenSilent(state.session!.refreshToken);
    }, refreshTime);

    return () => clearTimeout(timeoutId);
  }, [state.session, state.isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
