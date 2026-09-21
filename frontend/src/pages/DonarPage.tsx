import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { donacionesService } from '../services/donacionesService';
import toast from 'react-hot-toast';
import { configuracionService } from '../services/configuracionService';

// Montos rápidos basados en el precio de la sesión
const getMontosRapidos = (precio: number) => [
  { valor: Math.round(precio * 0.1), impacto: '10% de una sesión', emoji: '🌱' },
  { valor: Math.round(precio * 0.25), impacto: '25% de una sesión', emoji: '💛' },
  { valor: Math.round(precio * 0.5), impacto: '50% de una sesión', emoji: '✨' },
  { valor: precio, impacto: '1 sesión completa', emoji: '🌟' },
  { valor: precio * 2, impacto: '2 sesiones completas', emoji: '💝' },
  { valor: precio * 5, impacto: '5 sesiones completas', emoji: '🏆' },
];

const DonarPage: React.FC = () => {
  const navigate = useNavigate();
  const [monto, setMonto] = useState<number>(50000);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esAnonima, setEsAnonima] = useState(false);
  const [loading, setLoading] = useState(false);

    const [precioSesion, setPrecioSesion] = useState<number>(100000);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  // Cargar precio desde la configuración
  useEffect(() => {
    const cargarPrecio = async () => {
      try {
        const precio = await configuracionService.obtenerPrecioSesion();
        setPrecioSesion(precio);
      } catch (error) {
        console.error('Error al cargar precio:', error);
      } finally {
        setCargandoConfig(false);
      }
    };
    cargarPrecio();
  }, []);

  const handleMontoRapido = (valor: number) => {
    setMonto(valor);
    setMontoPersonalizado('');
  };

  const handleMontoPersonalizado = (valor: string) => {
    setMontoPersonalizado(valor);
    const num = parseInt(valor);
    if (!isNaN(num) && num > 0) {
      setMonto(num);
    }
  };

  // Calcular impacto del monto personalizado
  const calcularImpacto = (m: number) => {
    if (!precioSesion || precioSesion === 0) return 'Tu ayuda cuenta';
    
    // Si es menos de una sesión, mostrar porcentaje
    if (m < precioSesion) {
      const porcentaje = Math.round((m / precioSesion) * 100);
      return `${porcentaje}% de una sesión`;
    }
    
    // Si es 1 o más sesiones
    const sesiones = m / precioSesion;
    
    // Si es entero
    if (Number.isInteger(sesiones)) {
      if (sesiones === 1) return '1 sesión completa';
      return `${sesiones} sesiones completas`;
    }
    
    // Si tiene decimales (ej: 1.5 sesiones)
    return `${sesiones.toFixed(1)} sesiones`;
  };

  const handleDonar = async () => {
    if (!monto || monto < 5000) {
      toast.error('El monto mínimo de donación es $5.000 COP');
      return;
    }

    if (!esAnonima && !nombre.trim()) {
      toast.error('Por favor ingresa tu nombre o marca la opción de donación anónima');
      return;
    }

    if (!esAnonima && !email.trim()) {
      toast.error('Por favor ingresa tu email o marca la opción de donación anónima');
      return;
    }

    setLoading(true);

    try {
      const data = await donacionesService.generarFirma({
        monto,
        nombreDonante: esAnonima ? undefined : nombre,
        emailDonante: esAnonima ? undefined : email,
        mensaje: mensaje || undefined,
        esAnonima
      });

      console.log('✅ Firma generada:', data);

      // @ts-ignore - WidgetCheckout viene del script externo
      const checkout = new WidgetCheckout({
        currency: data.moneda,
        amountInCents: data.montoEnCentavos,
        reference: data.referencia,
        publicKey: data.publicKey,
        signature: {
          integrity: data.firmaIntegridad
        },
        redirectUrl: `${window.location.origin}/gracias?ref=${data.referencia}`,
        customerData: esAnonima ? undefined : {
          email: email,
          fullName: nombre
        }
      });

      checkout.open((result: any) => {
        const { transaction } = result;
        console.log('📊 Resultado transacción:', transaction);

        if (transaction.status === 'APPROVED') {
          toast.success('¡Gracias por tu donación! 💛');
          navigate(`/gracias?ref=${data.referencia}`);
        } else if (transaction.status === 'DECLINED') {
          toast.error('La transacción fue rechazada. Intenta con otro método de pago.');
        } else if (transaction.status === 'VOIDED') {
          toast.error('La transacción fue anulada.');
        } else {
          toast.error('Estado de transacción: ' + transaction.status);
        }
      });

    } catch (error: any) {
      console.error('❌ Error al procesar donación:', error);
      toast.error(error.response?.data?.error || 'Error al procesar la donación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0]">
      {/* Navegación */}
      <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
        <Link to="/" className="text-2xl font-serif font-bold text-[#3D405B]">
          Fundación Apoyo
        </Link>
        <Link
          to="/inicio"
          className="text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors flex items-center gap-2"
        >
          ← Volver
        </Link>
      </nav>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl mb-4"
          >
            💛
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4">
            Tu donación transforma vidas
          </h1>
          <p className="text-lg text-[#5D6078] max-w-xl mx-auto leading-relaxed">
            Cada aporte nos permite seguir acompañando a personas que necesitan un espacio seguro para sanar. Tu generosidad crea esperanza.
          </p>
        </motion.div>

        {/* Tarjeta principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-[#F2CC8F]/40"
        >
          {/* Montos rápidos con impacto */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-[#3D405B] mb-4">
              🎯 Elige el impacto que quieres generar
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getMontosRapidos(precioSesion).map((item) => (
                <motion.button
                  key={item.valor}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMontoRapido(item.valor)}
                  className={`p-4 rounded-2xl font-medium transition-all text-left ${
                    monto === item.valor && !montoPersonalizado
                      ? 'bg-gradient-to-br from-[#E07A5F] to-[#d16a4f] text-white shadow-lg shadow-[#E07A5F]/30'
                      : 'bg-[#F2CC8F]/20 text-[#3D405B] hover:bg-[#F2CC8F]/40 border border-[#F2CC8F]/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-lg font-bold">
                      ${item.valor.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className={`text-xs ${
                    monto === item.valor && !montoPersonalizado 
                      ? 'text-white/90' 
                      : 'text-[#5D6078]'
                  }`}>
                    {item.impacto}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Monto personalizado */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#3D405B] mb-3">
              O ingresa otro monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D405B] font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min="5000"
                step="1000"
                placeholder="5000"
                value={montoPersonalizado}
                onChange={(e) => handleMontoPersonalizado(e.target.value)}
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-lg text-[#3D405B] bg-white/80 font-medium"
              />
            </div>
            <p className="text-xs text-[#5D6078] mt-2">
              Monto mínimo: $5.000 COP
            </p>
          </div>

          {/* Resumen del impacto */}
          <motion.div
            key={monto}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8 p-6 bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-2xl text-center border border-[#F2CC8F]/50"
          >
            <p className="text-sm text-[#5D6078] mb-1">Vas a donar</p>
            <p className="text-4xl font-bold text-[#E07A5F] mb-2">
              ${monto.toLocaleString('es-CO')} COP
            </p>
            <p className="text-sm text-[#3D405B] font-medium">
              ✨ {calcularImpacto(monto)}
            </p>
          </motion.div>

          {/* Datos del donante */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#F2CC8F]/10 transition-colors">
              <input
                type="checkbox"
                checked={esAnonima}
                onChange={(e) => setEsAnonima(e.target.checked)}
                className="w-5 h-5 accent-[#E07A5F] cursor-pointer"
              />
              <span className="text-sm text-[#3D405B] font-medium">
                🤫 Quiero que mi donación sea anónima
              </span>
            </label>
          </div>

          {!esAnonima && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mb-6"
            >
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
              />
              <input
                type="email"
                placeholder="Tu correo electrónico (para enviarte el comprobante)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
              />
            </motion.div>
          )}

          {/* Mensaje opcional */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-[#3D405B] mb-2">
              💬 Mensaje (opcional)
            </label>
            <textarea
              placeholder="Comparte una palabra de aliento o dedica tu donación a alguien especial..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80 resize-none"
            />
          </div>

          {/* Botón de donar */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDonar}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#E07A5F] to-[#d16a4f] text-white py-5 rounded-full text-lg font-semibold hover:shadow-xl transition-all shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                Procesando...
              </>
            ) : (
              <>
                💛 Donar ${monto.toLocaleString('es-CO')} COP
              </>
            )}
          </motion.button>

          {/* Métodos de pago */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#5D6078] mb-3">
              Paga seguro con los métodos que prefieras:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-[#3D405B]">
              <span className="px-3 py-1.5 bg-white/80 rounded-full border border-[#F2CC8F]/40 font-medium">
                💳 Tarjetas
              </span>
              <span className="px-3 py-1.5 bg-white/80 rounded-full border border-[#F2CC8F]/40 font-medium">
                🏦 PSE
              </span>
              <span className="px-3 py-1.5 bg-white/80 rounded-full border border-[#F2CC8F]/40 font-medium">
                💜 Nequi
              </span>
              <span className="px-3 py-1.5 bg-white/80 rounded-full border border-[#F2CC8F]/40 font-medium">
                🏪 Efecty
              </span>
            </div>
          </div>
        </motion.div>

        {/* Sección de confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-4"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-[#F2CC8F]/40">
            <div className="text-3xl mb-2">🔒</div>
            <p className="font-semibold text-[#3D405B] mb-1">100% Seguro</p>
            <p className="text-xs text-[#5D6078]">
              Transacción protegida por Wompi
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-[#F2CC8F]/40">
            <div className="text-3xl mb-2">💛</div>
            <p className="font-semibold text-[#3D405B] mb-1">+500 personas</p>
            <p className="text-xs text-[#5D6078]">
              Ya han confiado en nosotros
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-[#F2CC8F]/40">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-[#3D405B] mb-1">100% de impacto</p>
            <p className="text-xs text-[#5D6078]">
              Tu donación se destina a las sesiones
            </p>
          </div>
        </motion.div>

        {/* Frase final */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center max-w-2xl mx-auto"
        >
          <p className="text-xl md:text-2xl font-serif text-[#3D405B] italic leading-relaxed">
            "Un pequeño gesto puede cambiar una vida entera."
          </p>
          <p className="text-sm text-[#5D6078] mt-4">
            ¿Tienes preguntas? Escríbenos a{' '}
            <a 
              href="mailto:contacto@fundacionapoyo.com" 
              className="text-[#E07A5F] hover:underline font-medium"
            >
              contacto@fundacionapoyo.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DonarPage;