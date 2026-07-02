import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await login(email, password);  // ← login retorna el usuario directamente
      
      // Redirigir según el rol que viene del backend
      if (user.rol === 'admin') {
        navigate('/admin');
      } else if (user.rol === 'guia') {
        navigate('/guia');
      } else {
        navigate('/usuario');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos. Espera un momento y vuelve a intentar.');
      } else {
        setError('Credenciales inválidas. Intenta de nuevo.');
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-primario mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primario w-full"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            ¿No tienes cuenta?{' '}
            <a href="/registro" className="text-primario hover:underline">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;