import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import {
  LoginPage,
  DashboardPage,
  RequestCertificatePage,
  CertificateDetailPage,
  AdminDashboardPage,
} from './pages';

/**
 * Componente principal da aplicação
 * Define as rotas com autenticação e proteção
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas - só acessíveis se NÃO autenticado */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Rotas protegidas do cliente */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request-certificate"
          element={
            <ProtectedRoute>
              <RequestCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates/:id"
          element={
            <ProtectedRoute>
              <CertificateDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas protegidas do admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect da raiz para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 - Redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
