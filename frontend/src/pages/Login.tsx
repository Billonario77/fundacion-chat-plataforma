import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      toast.success('¡Bienvenido de vuelta! 💛');
      navigate('/inicio');
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
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card principal */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-[#F2CC8F]/40 overflow-hidden">
            
            {/* Encabezado decorativo */}
            <div className="bg-gradient-to-br from-[#F2CC8F]/60 to-[#E07A5F]/40 px-8 py-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-3"
              >
                💛
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#3D405B] mb-2">
                Bienvenido de nuevo
              </h2>
              <p className="text-sm text-[#5D6078]">
                Nos alegra verte otra vez. Estamos aquí para ti.
              </p>
            </div>

            {/* Contenido */}
            <div className="p-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#3D405B] mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-[#3D405B] mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[#5D6078] hover:text-[#3D405B] transition-colors"
                      title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Link de olvidé mi contraseña */}
                <div className="text-right">
                  <Link 
                    to="/recuperar-contrasena" 
                    className="text-sm text-[#E07A5F] hover:text-[#d16a4f] font-medium hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Botón de ingresar */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E07A5F] to-[#d16a4f] text-white py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Ingresando...' : '💛 Ingresar'}
                </motion.button>
              </form>

              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#F2CC8F]/40"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-[#5D6078]">o</span>
                </div>
              </div>

              {/* Link a registro */}
              <Link
                to="/registro"
                className="block w-full text-center border-2 border-[#81B29A] text-[#81B29A] py-3 rounded-full font-medium hover:bg-[#81B29A]/10 transition-all"
              >
                ✨ Nueva Cuenta
              </Link>

              {/* Aviso de registro anónimo */}
              <div className="mt-6 bg-gradient-to-br from-[#F2CC8F]/20 to-[#81B29A]/10 rounded-2xl p-4 border border-[#F2CC8F]/40">
                <p className="text-xs text-[#5D6078] leading-relaxed text-center">
                  🎭 <strong className="text-[#3D405B]">¿Prefieres mantener tu privacidad?</strong>
                  <br />
                  Puedes registrarte de forma anónima con un NickName. 
                  <Link to="/registro" className="text-[#E07A5F] hover:underline font-medium ml-1">
                    Ver opción →
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de bienvenida */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-[#5D6078] mt-6 max-w-md mx-auto leading-relaxed"
          >
            No tienes que cargar todo solo.
            <br />
            <span className="font-serif italic text-[#3D405B]">
              "A veces, el primer paso es simplemente hablar."
            </span>
          </motion.p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;