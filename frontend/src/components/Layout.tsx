import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0] flex flex-col">
      {/* Header con estilo del HomePage */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#F2CC8F]/30 sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-6 py-4">
          <div className="flex justify-between items-center gap-2">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 md:gap-3 cursor-pointer group min-w-0"
              onClick={() => navigate(isAuthenticated ? '/inicio' : '/')}
            >
              <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform flex-shrink-0">💛</span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-2xl font-serif font-bold text-[#3D405B] group-hover:text-[#E07A5F] transition-colors">
                  <span className="hidden sm:inline">Fundación </span>Voces del Alma
                </h1>
                <p className="text-xs text-[#5D6078] hidden md:block">
                  Un espacio para respirar y sanar
                </p>
              </div>
            </div>

            {/* Menú de navegación */}
            <nav className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Botón Inicio */}
                  <button
                    onClick={() => navigate('/inicio')}
                    className={`w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 justify-center flex-shrink-0 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                      isActiveRoute('/inicio')
                        ? 'bg-[#E07A5F] text-white shadow-md shadow-[#E07A5F]/30' 
                        : 'text-[#3D405B] hover:bg-[#F2CC8F]/20'
                    }`}
                  >
                    <span className="text-lg">🏠</span>
                    <span className="hidden md:inline">Inicio</span>
                  </button>

                  {/* Botón Mi Espacio */}
                  <button
                    onClick={() => navigate(
                      user?.rol === 'guia' ? '/guia' : 
                      user?.rol === 'admin' ? '/admin' : '/usuario'
                    )}
                    className={`w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 justify-center flex-shrink-0 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                      isActiveRoute(
                        user?.rol === 'guia' ? '/guia' : 
                        user?.rol === 'admin' ? '/admin' : '/usuario'
                      )
                        ? 'bg-[#E07A5F] text-white shadow-md shadow-[#E07A5F]/30' 
                        : 'text-[#3D405B] hover:bg-[#F2CC8F]/20'
                    }`}
                  >
                    <span className="text-lg">📋</span>
                    <span className="hidden md:inline">Mi espacio</span>
                  </button>

                  {/* Botón Salir */}
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 justify-center flex-shrink-0 rounded-full font-medium transition-all duration-300 flex items-center gap-2 text-[#E07A5F] hover:bg-[#E07A5F]/10 border border-[#E07A5F]/30"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="hidden md:inline">Salir</span>
                  </button>
                </>
              ) : (
                /* Botón Ingresar */
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActiveRoute('/login') || isActiveRoute('/registro')
                      ? 'bg-[#E07A5F] text-white shadow-md shadow-[#E07A5F]/30'
                      : 'bg-[#E07A5F] text-white hover:bg-[#d16a4f] shadow-md shadow-[#E07A5F]/20'
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
      <main className="flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;