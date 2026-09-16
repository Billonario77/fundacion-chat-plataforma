import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { donacionesService } from '../services/donacionesService';

const GraciasPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referencia = searchParams.get('ref');
  const [donacion, setDonacion] = useState<any>(null);

  useEffect(() => {
    if (referencia) {
      donacionesService.obtenerPorReferencia(referencia)
        .then(setDonacion)
        .catch(console.error);
    }
  }, [referencia]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-xl max-w-lg w-full text-center border border-[#F2CC8F]/40"
      >
        <div className="text-7xl mb-6">💛</div>
        <h1 className="text-3xl md:text-4xl font-serif text-[#3D405B] mb-4">
          ¡Gracias por tu donación!
        </h1>
        <p className="text-lg text-[#5D6078] mb-8">
          Tu generosidad hace posible que más personas encuentren un espacio de paz y sanación.
        </p>

        {donacion && (
          <div className="bg-[#F2CC8F]/20 rounded-2xl p-4 mb-6 text-sm text-[#3D405B]">
            <p>
              <strong>Referencia:</strong> {donacion.referencia_wompi}
            </p>
            <p>
              <strong>Monto:</strong> ${parseFloat(donacion.monto).toLocaleString('es-CO')} COP
            </p>
            <p>
              <strong>Estado:</strong> {donacion.estado}
            </p>
          </div>
        )}

        <p className="text-[#5D6078] italic mb-8">
          "Cada acto de bondad, por pequeño que sea, transforma el mundo."
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-[#E07A5F] text-white px-8 py-3 rounded-full font-medium hover:bg-[#d16a4f] transition-all hover:scale-105"
          >
            Volver al inicio
          </Link>
          <Link
            to="/donar"
            className="border-2 border-[#81B29A] text-[#81B29A] px-8 py-3 rounded-full font-medium hover:bg-[#81B29A]/10 transition-all"
          >
            Donar de nuevo
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default GraciasPage;