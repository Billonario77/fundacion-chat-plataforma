import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://fundacion-chat-plataforma-backend-api.onrender.com';

const RecuperarContrasena: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'solicitar' | 'verificar'>('solicitar');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/recuperacion/solicitar`, { email });
      toast.success('Código enviado a tu correo');
      setStep('verificar');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nuevaPassword) {
      toast.error('Por favor ingresa el código y tu nueva contraseña');
      return;
    }

    if (nuevaPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/recuperacion/verificar`, {
        email,
        codigo,
        nuevaPassword
      });
      toast.success('Contraseña actualizada exitosamente');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'solicitar' ? 'Recuperar contraseña' : 'Verificar código'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'solicitar'
              ? 'Ingresa tu email para recibir un código de verificación'
              : `Ingresa el código enviado a ${email}`}
          </p>
        </div>

        {step === 'solicitar' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSolicitar}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Volver al login
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerificar}>
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                Código de verificación
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label htmlFor="nuevaPassword" className="block text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <input
                id="nuevaPassword"
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Verificando...' : 'Actualizar contraseña'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('solicitar')}
                className="text-sm text-blue-600 hover:underline"
              >
                Volver a enviar código
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecuperarContrasena;