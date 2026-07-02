import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    // Pequeño delay para asegurar que el estado se limpie antes de navegar
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      {/* Header con diseño mejorado */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo con efecto hover */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="bg-primario/10 p-2 rounded-xl group-hover:bg-primario/20 transition-all duration-300">
                <span className="text-2xl">🤝</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primario group-hover:text-primario-dark transition-colors">
                  Fundación Apoyo
                </h1>
                <p className="text-xs text-texto-claro">Espacio de rehabilitación</p>
              </div>
            </div>

            {/* Menú de navegación mejorado */}
            <nav className="flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  {/* Botón Inicio - siempre visible */}
                  <button
                    onClick={() => navigate('/')}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActiveRoute('/') 
                        ? 'bg-primario text-white shadow-md' 
                        : 'text-texto hover:bg-primario/10 hover:text-primario'
                    }`}
                  >
                    <span className="text-lg">🏠</span>
                    <span className="hidden md:inline">Inicio</span>
                  </button>

                  {/* Botón Mi Espacio - según rol */}
                  <button
                    onClick={() => navigate(
                      user?.rol === 'guia' ? '/guia' : 
                      user?.rol === 'admin' ? '/admin' : '/usuario'
                    )}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActiveRoute(
                        user?.rol === 'guia' ? '/guia' : 
                        user?.rol === 'admin' ? '/admin' : '/usuario'
                      )
                        ? 'bg-primario text-white shadow-md' 
                        : 'text-texto hover:bg-primario/10 hover:text-primario'
                    }`}
                  >
                    <span className="text-lg">📋</span>
                    <span className="hidden md:inline">Mi espacio</span>
                  </button>

                  {/* Botón Salir - con estilo diferenciado */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 bg-alerta/10 text-alerta hover:bg-alerta/20 hover:shadow-md"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="hidden md:inline">Salir</span>
                  </button>
                </>
              ) : (
                /* Botón Ingresar para no autenticados */
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                    isActiveRoute('/login') || isActiveRoute('/registro')
                      ? 'bg-primario text-white shadow-md'
                      : 'bg-primario/10 text-primario hover:bg-primario/20 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg">🔑</span>
                  <span>Ingresar</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-texto-claro text-sm">
            © 2026 Fundación Apoyo - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;