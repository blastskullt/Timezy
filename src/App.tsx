import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider } from './components/Security/SecurityProvider';
import { Sidebar } from './components/Layout/Sidebar';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ErrorMessage } from './components/UI/ErrorMessage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Professionals } from './pages/Professionals';
import { Clients } from './pages/Clients';
import { Services } from './pages/Services';
import { ServiceLocations } from './pages/ServiceLocations';
import { Access } from './pages/Access';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  console.log('🔒 ProtectedRoute - User:', user?.email, 'Role:', user?.role, 'Loading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando aplicação...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('🚫 Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ Usuário autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, error } = useData();

  console.log('📱 AppContent - User:', user?.email, 'Role:', user?.role, 'Data Loading:', isLoading);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => window.location.reload()} 
            />
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center py-8 mb-6">
              <LoadingSpinner size="md" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando dados do sistema...</span>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/services" element={<Services />} />
            <Route path="/locations" element={<ServiceLocations />} />
            <Route path="/access" element={<Access />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  console.log('🚀 Iniciando aplicação Timezy Pro...');
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <SecurityProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <DataProvider>
                    <AppContent />
                  </DataProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </SecurityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;