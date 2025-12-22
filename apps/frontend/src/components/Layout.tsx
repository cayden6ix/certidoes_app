import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout principal da aplicação
 * Navbar/Sidebar simples conforme Sprint 1
 */
export function Layout({ children }: LayoutProps): JSX.Element {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/request-certificate', label: 'Solicitar Certidão' },
  ];

  const isActive = (path: string): boolean => location.pathname === path;

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
            <div className="flex items-center">
              <Link
                to="/login"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
