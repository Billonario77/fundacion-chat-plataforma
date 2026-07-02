import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Inicio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (user) {
    if (user.rol === 'usuario') return <Navigate to="/usuario" replace />;
    if (user.rol === 'guia') return <Navigate to="/guia" replace />;
    if (user.rol === 'admin') return <Navigate to="/admin" replace />;
  }
  
  return (
    <Layout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl">🤝</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-primario mb-4">
          Bienvenido a la Fundación Apoyo
        </h2>
        <p className="text-xl text-texto-claro max-w-3xl mx-auto">
          Un espacio de rehabilitación y acompañamiento para quienes buscan 
          recuperar el control de sus vidas
        </p>
      </div>

      {/* Tarjetas de servicios */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="card text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-4 text-primario">🎯</div>
          <h3 className="text-xl font-semibold text-primario mb-3">
            Apoyo Personalizado
          </h3>
          <p className="text-texto-claro">
            Sesiones uno a uno con guías especializados en rehabilitación
          </p>
        </div>

        <div className="card text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-4 text-secundario">⚡</div>
          <h3 className="text-xl font-semibold text-secundario mb-3">
            Crisis Inmediata
          </h3>
          <p className="text-texto-claro">
            Atención prioritaria cuando más lo necesitas, 24/7
          </p>
        </div>

        <div className="card text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-4 text-terciario">📋</div>
          <h3 className="text-xl font-semibold text-terciario mb-3">
            Seguimiento Continuo
          </h3>
          <p className="text-texto-claro">
            Acompañamiento constante en tu proceso de recuperación
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
        <button 
          onClick={() => navigate('/login')}
          className="btn-primario px-8 py-3 text-lg"
        >
          Iniciar sesión
        </button>
        <button 
          onClick={() => navigate('/registro')}
          className="btn-secundario px-8 py-3 text-lg"
        >
          Registrarse
        </button>
      </div>

      {/* Mensaje de confianza */}
      <div className="max-w-3xl mx-auto text-center bg-gray-50 rounded-xl p-8 border border-gray-200">
        <p className="text-texto text-lg italic">
          "Cada persona tiene su propio camino. Aquí encontrarás el apoyo necesario 
          para recorrer el tuyo, sin juicios, con respeto y profesionalismo."
        </p>
      </div>
    </Layout>
  );
};

export default Inicio;