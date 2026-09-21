import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { donacionesService } from '../services/donacionesService';
import toast from 'react-hot-toast';

// Montos predefinidos
const MONTOS_RAPIDOS = [10000, 20000, 50000, 100000, 200000, 500000];

const DonarPage: React.FC = () => {
  const navigate = useNavigate();
  const [monto, setMonto] = useState<number>(50000);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esAnonima, setEsAnonima] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleDonar = async () => {
    // Validaciones
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
      // 1. Solicitar firma al backend
      const data = await donacionesService.generarFirma({
        monto,
        nombreDonante: esAnonima ? undefined : nombre,
        emailDonante: esAnonima ? undefined : email,
        mensaje: mensaje || undefined,
        esAnonima
      });

      console.log('✅ Firma generada:', data);

      // 2. Abrir el Widget de Wompi
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
        <Link to="/inicio" className="text-2xl font-serif font-bold text-[#3D405B]">
          Fundación Apoyo
        </Link>
        <Link
          to="/inicio"
          className="text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors"
        >
          ← Volver al inicio
        </Link>
      </nav>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="text-6xl mb-4">💛</div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4">
            Tu donación transforma vidas
          </h1>
          <p className="text-lg text-[#5D6078] max-w-xl mx-auto">
            Cada aporte nos permite seguir acompañando a personas que necesitan un espacio seguro para sanar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#F2CC8F]/40"
        >
          {/* Montos rápidos */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-[#3D405B] mb-3">
              Elige un monto
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MONTOS_RAPIDOS.map((valor) => (
                <button
                  key={valor}
                  onClick={() => handleMontoRapido(valor)}
                  className={`py-4 rounded-2xl font-medium transition-all ${
                    monto === valor && !montoPersonalizado
                      ? 'bg-[#E07A5F] text-white shadow-lg scale-105'
                      : 'bg-[#F2CC8F]/30 text-[#3D405B] hover:bg-[#F2CC8F]/50'
                  }`}
                >
                  ${valor.toLocaleString('es-CO')}
                </button>
              ))}
            </div>
          </div>

          {/* Monto personalizado */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-[#3D405B] mb-3">
              O ingresa un monto personalizado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D405B] font-bold">
                $
              </span>
              <input
                type="number"
                min="5000"
                step="1000"
                placeholder="5000"
                value={montoPersonalizado}
                onChange={(e) => handleMontoPersonalizado(e.target.value)}
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-lg text-[#3D405B] bg-white/80"
              />
            </div>
            <p className="text-xs text-[#5D6078] mt-2">
              Monto mínimo: $5.000 COP
            </p>
          </div>

          {/* Monto seleccionado */}
          <div className="mb-8 p-4 bg-[#F2CC8F]/20 rounded-2xl text-center">
            <p className="text-sm text-[#5D6078]">Vas a donar</p>
            <p className="text-3xl font-bold text-[#E07A5F]">
              ${monto.toLocaleString('es-CO')} COP
            </p>
          </div>

          {/* Datos del donante */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={esAnonima}
                onChange={(e) => setEsAnonima(e.target.checked)}
                className="w-5 h-5 accent-[#E07A5F]"
              />
              <span className="text-sm text-[#3D405B]">
                Quiero que mi donación sea anónima
              </span>
            </label>
          </div>

          {!esAnonima && (
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
              />
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80"
              />
            </div>
          )}

          {/* Mensaje opcional */}
          <div className="mb-8">
            <textarea
              placeholder="Mensaje opcional (nos encantaría leerte)"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#F2CC8F]/50 focus:border-[#E07A5F] focus:outline-none text-[#3D405B] bg-white/80 resize-none"
            />
          </div>

          {/* Botón de donar */}
          <button
            onClick={handleDonar}
            disabled={loading}
            className="w-full bg-[#E07A5F] text-white py-5 rounded-full text-lg font-medium hover:bg-[#d16a4f] transition-all hover:scale-[1.02] shadow-lg shadow-[#E07A5F]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Procesando...
              </>
            ) : (
              <>
                💛 Donar ${monto.toLocaleString('es-CO')} COP
              </>
            )}
          </button>

          {/* Métodos de pago */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#5D6078] mb-3">
              Aceptamos los siguientes métodos de pago seguros:
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-[#5D6078]">
              <span className="px-3 py-1 bg-white/60 rounded-full">💳 Tarjetas</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">🏦 PSE</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">💜 Nequi</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">🏪 Efecty</span>
            </div>
          </div>
        </motion.div>

        {/* Nota de seguridad */}
        <div className="mt-8 text-center text-sm text-[#5D6078]">
          <p>🔒 Transacción 100% segura procesada por Wompi</p>
          <p className="mt-2">
            ¿Tienes preguntas? Escríbenos a{' '}
            <a href="mailto:contacto@fundacionapoyo.com" className="text-[#E07A5F] hover:underline">
              contacto@fundacionapoyo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonarPage;