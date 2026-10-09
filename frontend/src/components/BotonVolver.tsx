import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BotonVolver: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleVolver = () => {
    // Si la navegación actual no es la primera (hay historial), volvemos atrás
    // React Router usa location.key === 'default' cuando es la primera entrada
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }

    // No hay historial → fallback según sesión
    if (isAuthenticated && user?.rol === 'usuario') {
      navigate('/inicio');
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleVolver}
      className="text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors flex items-center gap-2 flex-shrink-0"
    >
      ← Volver
    </button>
  );
};

export default BotonVolver;