import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import InicioUsuario from './InicioUsuario';
import InicioGuia from './InicioGuia';
import InicioAdmin from './InicioAdmin';
import { Navigate } from 'react-router-dom';

const Inicio: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.rol === 'admin') {
    return <InicioAdmin />;
  }

  if (user.rol === 'guia') {
    return <InicioGuia />;
  }

  return <InicioUsuario />;
};

export default Inicio;