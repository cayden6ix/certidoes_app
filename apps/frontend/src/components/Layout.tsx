import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout principal da aplicação
 * Navbar com informações do usuário e logout
 */
export function Layout({ children }: LayoutProps): JSX.Element {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/request-certificate', label: 'Solicitar Certidão' },
  ];

  // Adiciona itens de admin se o usuário for admin
  if (user?.role === 'admin') {
    navItems.unshift({ path: '/admin/dashboard', label: 'Admin' });
  }

  const isActive = (path: string): boolean => location.pathname === path;

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/" className="text-xl font-bold text-primary-600">
                  Certidões
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive(item.path)
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Área do usuário */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  {/* Informações do usuário */}
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                    <span className="text-xs text-gray-500">
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>

                  {/* Avatar com inicial */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Botão de logout */}
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
