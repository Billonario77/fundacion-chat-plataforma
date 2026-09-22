import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Registro: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [nickname, setNickname] = useState('');
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (esAnonimo) {
      if (!nickname.trim()) {
        setError('Debes ingresar un NickName si eliges el modo anónimo');
        return;
      }
      if (!aceptaHabeasData) {
        setError('Debes aceptar el aviso de tratamiento de datos');
        return;
      }
    } else {
      if (!nombre.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
    }

    try {
      await register(email, password, esAnonimo ? '' : nombre, esAnonimo, nickname);
      toast.success('¡Bienvenido a Fundación Voces del Alma! 💛');
      navigate('/inicio');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al registrarse. Intenta de nuevo.';
      setError(errorMsg);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
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
                🌱
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#3D405B] mb-2">
                Crear Cuenta
              </h2>
              <p className="text-sm text-[#5D6078]">
                Estás dando el primer paso. Estamos aquí para acompañarte.
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
                
                {/* Casilla de modo anónimo */}
                <div className="bg-gradient-to-br from-[#F2CC8F]/20 to-[#81B29A]/10 rounded-2xl p-4 border border-[#F2CC8F]/40">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esAnonimo}
                      onChange={(e) => setEsAnonimo(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-[#E07A5F] cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <span className="font-medium text-[#3D405B] text-sm">
                        🎭 Quiero registrarme como anónimo
                      </span>
                      <p className="text-xs text-[#5D6078] mt-1 leading-relaxed">
                        Tu identidad estará protegida. Solo necesitas un NickName para que podamos dirigirnos a ti en las sesiones.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Nombre o NickName según el modo */}
                {esAnonimo ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      NickName o Alias <span className="text-[#E07A5F]">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Ej: EstrellaAzul, LunaSerena..."
                      required={esAnonimo}
                      maxLength={50}
                    />
                    <p className="text-xs text-[#5D6078] mt-1">
                      Este será tu nombre en la plataforma. Elige algo que te represente.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Nombre completo <span className="text-[#E07A5F]">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: María Elena García"
                      required={!esAnonimo}
                    />
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#3D405B] mb-2">
                    Correo electrónico <span className="text-[#E07A5F]">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                  <p className="text-xs text-[#5D6078] mt-1">
                    Será tu usuario para iniciar sesión
                  </p>
                </div>

                {/* Contraseñas */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Contraseña <span className="text-[#E07A5F]">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3D405B] mb-2">
                      Confirmar contraseña <span className="text-[#E07A5F]">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                    />
                  </div>
                </div>

                {/* Aviso de Habeas Data (solo para anónimos) */}
                {esAnonimo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#81B29A]/10 rounded-2xl p-4 border border-[#81B29A]/30"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aceptaHabeasData}
                        onChange={(e) => setAceptaHabeasData(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[#E07A5F] cursor-pointer flex-shrink-0"
                        required={esAnonimo}
                      />
                      <div>
                        <span className="font-medium text-[#3D405B] text-sm">
                          Acepto el tratamiento de datos personales
                        </span>
                        <p className="text-xs text-[#5D6078] mt-1 leading-relaxed">
                          Entiendo que si realizo un pago o donación, mis datos personales (nombre y email) serán tratados por la pasarela de pagos <strong>Wompi</strong> bajo la <strong>Ley 1581 de Habeas Data</strong>. Los pagos requieren información real por temas legales y de seguridad.
                        </p>
                      </div>
                    </label>
                  </motion.div>
                )}

                {/* Términos y condiciones (siempre) */}
                {!esAnonimo && (
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        className="w-5 h-5 mt-0.5 accent-[#E07A5F] cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-[#5D6078] leading-relaxed">
                        Acepto los <Link to="/terminos" className="text-[#E07A5F] hover:underline">términos y condiciones</Link> y la{' '}
                        <Link to="/privacidad" className="text-[#E07A5F] hover:underline">política de privacidad</Link>
                      </span>
                    </label>
                  </div>
                )}

                {/* Botón de registro */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E07A5F] to-[#d16a4f] text-white py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Creando cuenta...' : '✨ Crear mi cuenta'}
                </motion.button>
              </form>

              {/* Link a login */}
              <div className="mt-6 pt-6 border-t border-[#F2CC8F]/30 text-center">
                <p className="text-sm text-[#5D6078]">
                  ¿Ya tienes cuenta?{' '}
                  <Link 
                    to="/login" 
                    className="text-[#E07A5F] hover:text-[#d16a4f] font-semibold hover:underline"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de confianza */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-[#5D6078] mt-6 max-w-md mx-auto"
          >
            🔒 Tu privacidad es nuestra prioridad. Tu información está protegida y solo se usará para acompañarte en tu proceso.
          </motion.p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Registro;