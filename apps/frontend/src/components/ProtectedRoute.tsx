import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  /** Conteúdo a ser renderizado se autenticado */
  children: JSX.Element;
  /** Roles permitidas para acessar a rota (opcional - se não informado, qualquer role é permitida) */
  allowedRoles?: Array<'client' | 'admin'>;
}

/**
 * Componente de rota protegida
 * Redireciona para login se não autenticado
 * Redireciona para dashboard se role não permitida
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Exibe loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redireciona para login se não autenticado
  if (!isAuthenticated) {
    // Salva a URL atual para redirecionar após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se o role do usuário é permitido
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redireciona para o dashboard apropriado
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

/**
 * Componente para rotas que só devem ser acessadas por usuários NÃO autenticados
 * Exemplo: página de login - se já estiver logado, redireciona para dashboard
 */
interface PublicOnlyRouteProps {
  children: JSX.Element;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Exibe loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se já está autenticado, redireciona para o dashboard apropriado
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
