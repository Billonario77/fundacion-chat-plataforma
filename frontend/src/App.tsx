import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import GuiaDashboard from './pages/GuiaDashboard';
import DetalleTurno from './pages/DetalleTurno';
import UsuarioDashboard from './pages/UsuarioDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { MensajesNoLeidosProvider } from './contexts/MensajesNoLeidosContext';
import RecuperarContrasena from './pages/RecuperarContrasena';
import DonarPage from './pages/DonarPage';
import GraciasPage from './pages/GraciasPage';
import Inicio from './pages/Inicio';
import TestimoniosPage from './pages/TestimoniosPage';
import ScrollToTop from './components/ScrollToTop';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const GuiaRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }
  
  if (user?.rol !== 'guia') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }
  
  if (user?.rol !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/donar" element={<DonarPage />} />
      <Route path="/testimonios" element={<TestimoniosPage />} />
      <Route path="/gracias" element={<GraciasPage />} />
      
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
      
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/guia"
        element={
          <GuiaRoute>
            <GuiaDashboard />
          </GuiaRoute>
        }
      />
      
      <Route
        path="/turnos/:id"
        element={
          <PrivateRoute>
            <DetalleTurno />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/usuario"
        element={
          <PrivateRoute>
            <UsuarioDashboard />
          </PrivateRoute>
        }
      />

            <Route
        path="/inicio"
        element={
          <PrivateRoute>
            <Inicio />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>    
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <MensajesNoLeidosProvider>
            <Toaster position="top-right" />
            <AppContent />
            <ScrollToTop />
          </MensajesNoLeidosProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;