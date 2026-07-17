import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="card">
        <h2 className="text-2xl font-bold text-primario mb-4">
          Bienvenido, {user?.nombre}
        </h2>
        
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Has iniciado sesión como <strong>{user?.rol}</strong>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Email: {user?.email}
          </p>
          
          <button
            onClick={logout}
            className="btn-secundario"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
