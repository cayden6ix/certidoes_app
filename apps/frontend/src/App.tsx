import { Routes, Route, Navigate } from 'react-router-dom';

import { LoginPage, DashboardPage, RequestCertificatePage } from './pages';

/**
 * Componente principal da aplicação
 * Define as rotas conforme Sprint 1
 */
function App(): JSX.Element {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas do cliente (serão protegidas na Sprint 2) */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/request-certificate" element={<RequestCertificatePage />} />

      {/* Redirect da raiz para dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - Redireciona para dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
