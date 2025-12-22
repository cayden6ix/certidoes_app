import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage, DashboardPage, RequestCertificatePage } from './pages';

/**
 * Componente principal da aplicação
 * Gerencia autenticação e rotas protegidas
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas (requerem autenticação) */}
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

        {/* Redirect da raiz para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 - Redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
