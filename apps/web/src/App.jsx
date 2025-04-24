// apps/web/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import ProviderLayout from './components/layout/ProviderLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import SearchPage from './pages/public/SearchPage';
import ProvidersPage from './pages/public/ProvidersPage';
import LocationDetailPage from './pages/public/LocationDetailPage';
import AboutPage from './pages/public/AboutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Provider Pages
import ProviderDashboard from './pages/provider/Dashboard';
import LocationsPage from './pages/provider/LocationsPage';
import LocationFormPage from './pages/provider/LocationFormPage';
import ProceduresPage from './pages/provider/ProceduresPage';
import ProcedureFormPage from './pages/provider/ProcedureFormPage';
import ProfilePage from './pages/provider/ProfilePage';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
          <Route path="/providers" element={<PublicLayout><ProvidersPage /></PublicLayout>} />
          <Route path="/locations/:id" element={<PublicLayout><LocationDetailPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
          
          {/* Provider Routes */}
          <Route path="/provider/dashboard" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <ProviderDashboard />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/locations" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <LocationsPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/locations/new" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <LocationFormPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/locations/:id/edit" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <LocationFormPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/locations/:locationId/procedures" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <ProceduresPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/locations/:locationId/add-procedure" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <ProcedureFormPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/procedures/:procedureId/edit" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <ProcedureFormPage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/provider/profile" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <ProviderLayout>
                <ProfilePage />
              </ProviderLayout>
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<PublicLayout><div>Page Not Found</div></PublicLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
