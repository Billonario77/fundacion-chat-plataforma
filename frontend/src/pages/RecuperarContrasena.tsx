import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

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
      await axios.post(`${API_URL}/api/recuperacion/solicitar`, { email });
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
        nuevaPassword,
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
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-[#F2CC8F]/40 overflow-hidden">
            {/* Encabezado decorativo */}
            <div className="bg-gradient-to-br from-[#F2CC8F]/60 to-[#E07A5F]/40 px-6 md:px-8 py-6 md:py-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-3"
              >
                🔑
              </motion.div>
              <h2 className="text-xl md:text-3xl font-serif text-[#3D405B] mb-2">
                {step === 'solicitar' ? 'Recuperar contraseña' : 'Verificar código'}
              </h2>
              <p className="text-sm text-[#5D6078]">
                {step === 'solicitar'
                  ? 'Ingresa tu email y te enviaremos un código de verificación.'
                  : `Ingresa el código que enviamos a ${email}`}
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 md:p-8">
              {step === 'solicitar' ? (
                <form onSubmit={handleSolicitar} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      placeholder="tu@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#E07A5F] to-[#d16a4f] text-white py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:shadow-xl transition-all shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Enviando...' : '📧 Enviar código'}
                  </motion.button>

                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="text-sm text-[#E07A5F] hover:text-[#d16a4f] hover:underline font-medium"
                    >
                      ← Volver al login
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerificar} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Código de verificación
                    </label>
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80 text-center text-lg tracking-widest font-mono"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#E07A5F] to-[#d16a4f] text-white py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:shadow-xl transition-all shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Verificando...' : '🔒 Actualizar contraseña'}
                  </motion.button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('solicitar')}
                      className="text-sm text-[#E07A5F] hover:text-[#d16a4f] hover:underline font-medium"
                    >
                      ← Volver a enviar código
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Mensaje de ayuda */}
          <p className="text-center text-xs text-[#5D6078] mt-6 max-w-md mx-auto leading-relaxed">
            🔒 Revisa tu bandeja de entrada y la carpeta de spam si no ves el correo en unos minutos.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default RecuperarContrasena;