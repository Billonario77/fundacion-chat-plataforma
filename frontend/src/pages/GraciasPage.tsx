import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { donacionesService } from '../services/donacionesService';
import toast from 'react-hot-toast';

const GraciasPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referencia = searchParams.get('ref');
  const [donacion, setDonacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (referencia) {
      donacionesService.obtenerPorReferencia(referencia)
        .then((data) => {
          setDonacion(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [referencia]);

  // Calcular nivel de impacto según monto
  const getNivelImpacto = (monto: number) => {
    if (monto >= 500000) return { nivel: 'oro', emoji: '🌟', texto: 'Impacto extraordinario' };
    if (monto >= 100000) return { nivel: 'plata', emoji: '✨', texto: 'Gran impacto' };
    if (monto >= 20000) return { nivel: 'bronce', emoji: '💛', texto: 'Impacto significativo' };
    return { nivel: 'semilla', emoji: '🌱', texto: 'Semilla de esperanza' };
  };

  const formatCurrency = (v: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(v);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const impacto = donacion ? getNivelImpacto(parseFloat(donacion.monto)) : null;
  const nombreMostrar = donacion?.nombre_donante?.split(' ')[0] || null;
  const esAnonima = donacion?.es_anonima;

  const compartirEnWhatsApp = () => {
    const texto = encodeURIComponent(
      'Acabo de donar a Fundación Apoyo 💛 Un espacio para respirar y sanar. Únete: https://fundacion-chat-frontend-api.netlify.app/donar'
    );
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  const compartirEnTwitter = () => {
    const texto = encodeURIComponent(
      'Acabo de donar a @FundacionApoyo 💛 Un espacio seguro para sanar. Únete: https://fundacion-chat-frontend-api.netlify.app/donar'
    );
    window.open(`https://twitter.com/intent/tweet?text=${texto}`, '_blank');
  };

  const copiarLink = () => {
    navigator.clipboard.writeText('https://fundacion-chat-frontend-api.netlify.app/donar');
    toast.success('Link copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0] flex items-center justify-center p-6">
        <p className="text-[#5D6078]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0] py-12 px-4">
      {/* Confetti sutil de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: ['0vh', '100vh'],
              opacity: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear'
            }}
            className="absolute text-2xl"
            style={{ left: `${Math.random() * 100}%` }}
          >
            {['💛', '✨', '🌱', '💝', '⭐'][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl max-w-2xl w-full mx-auto border border-[#F2CC8F]/40"
      >
        {/* Icono principal animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl mb-6 text-center"
        >
          💛
        </motion.div>

        {/* Título personalizado */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-serif text-[#3D405B] mb-4 text-center"
        >
          {nombreMostrar && !esAnonima 
            ? `¡Gracias, ${nombreMostrar}!`
            : '¡Gracias por tu donación!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-[#5D6078] mb-8 text-center leading-relaxed"
        >
          {nombreMostrar && !esAnonima
            ? `${nombreMostrar}, tu generosidad hace posible que más personas encuentren un espacio de paz y sanación.`
            : 'Tu generosidad hace posible que más personas encuentren un espacio de paz y sanación.'}
        </motion.p>

        {/* Nivel de impacto */}
        {impacto && donacion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-2xl p-6 mb-6 text-center border border-[#F2CC8F]/40"
          >
            <div className="text-5xl mb-2">{impacto.emoji}</div>
            <p className="text-sm text-[#5D6078] mb-1">Tu nivel de impacto</p>
            <p className="text-xl font-bold text-[#E07A5F]">{impacto.texto}</p>
            <p className="text-3xl font-bold text-[#3D405B] mt-3">
              {formatCurrency(parseFloat(donacion.monto))}
            </p>
          </motion.div>
        )}

        {/* Mensaje del donante */}
        {donacion?.mensaje && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#F4E8D8]/60 rounded-2xl p-5 mb-6 border-l-4 border-[#81B29A]"
          >
            <p className="text-sm text-[#5D6078] mb-2">Tu mensaje:</p>
            <p className="text-[#3D405B] italic">"{donacion.mensaje}"</p>
          </motion.div>
        )}

        {/* Detalles de la donación */}
        {donacion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-5 mb-6 border border-[#F2CC8F]/40"
          >
            <h3 className="text-sm font-semibold text-[#3D405B] mb-3">📋 Detalles de tu donación</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5D6078]">Referencia:</span>
                <span className="text-[#3D405B] font-mono text-xs">{donacion.referencia_wompi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6078]">Fecha:</span>
                <span className="text-[#3D405B]">{formatFecha(donacion.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6078]">Estado:</span>
                <span className={`font-medium ${
                  donacion.estado === 'completada' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {donacion.estado === 'completada' ? '✅ Completada' : `⏳ ${donacion.estado}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Frase inspiradora */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[#5D6078] italic text-center mb-8 text-lg"
        >
          "Cada acto de bondad, por pequeño que sea, transforma el mundo."
        </motion.p>

        {/* Compartir */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <p className="text-sm text-center text-[#5D6078] mb-3">
            ¿Quieres inspirar a más personas?
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={compartirEnWhatsApp}
              className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#1ea855] transition-all hover:scale-105"
            >
              <span>💬</span> WhatsApp
            </button>
            <button
              onClick={compartirEnTwitter}
              className="flex items-center gap-2 bg-[#1DA1F2] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0d8ddb] transition-all hover:scale-105"
            >
              <span>🐦</span> Twitter
            </button>
            <button
              onClick={copiarLink}
              className="flex items-center gap-2 bg-[#3D405B] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#2a2d3f] transition-all hover:scale-105"
            >
              <span>🔗</span> Copiar link
            </button>
          </div>
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to="/inicio"
            className="bg-[#E07A5F] text-white px-8 py-3 rounded-full font-medium hover:bg-[#d16a4f] transition-all hover:scale-105 text-center"
          >
            🏠 Volver al inicio
          </Link>
          <Link
            to="/donar"
            className="border-2 border-[#81B29A] text-[#81B29A] px-8 py-3 rounded-full font-medium hover:bg-[#81B29A]/10 transition-all text-center"
          >
            💛 Donar de nuevo
          </Link>
        </motion.div>

        {/* Nota final */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs text-center text-[#5D6078] mt-8 pt-6 border-t border-[#F2CC8F]/30"
        >
          Recibirás un correo de confirmación en tu bandeja de entrada 💌
        </motion.p>
      </motion.div>
    </div>
  );
};

export default GraciasPage;