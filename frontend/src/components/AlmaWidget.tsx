import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BotonAlma from './BotonAlma';
import ChatIA from './ChatIA';

const AlmaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  return (
    <>
      {/* Ventana de Chat - z-[100] para que esté por ENCIMA de WhatsApp y la flecha */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-20 right-4 left-4 md:left-auto md:bottom-24 md:right-10 z-[100] sm:w-96 h-[500px] max-h-[75vh] shadow-2xl rounded-2xl bg-white"
          >
            <ChatIA onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor de la Vela Flotante - Subimos su posición para que no choque */}
      {!isOpen && !isHidden && (
        <div className="fixed bottom-32 right-6 md:bottom-28 md:right-10 z-50 group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="absolute -top-1 -right-1 bg-gray-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-[60] shadow-md transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
            title="Esconder a Alma"
          >
            ✕
          </button>

          <BotonAlma onClick={() => setIsOpen(true)} />
        </div>
      )}

      {/* Pestañita lateral (si está escondida) - Mantenemos su posición alta */}
      {isHidden && !isOpen && (
        <button
          onClick={() => setIsHidden(false)}
          className="fixed bottom-32 right-0 md:bottom-28 z-50 bg-[#E07A5F] text-white py-2 px-1.5 rounded-l-lg shadow-md hover:bg-[#d16a4f] transition-all flex flex-col items-center justify-center gap-1 group"
          title="Chatear con Alma"
        >
          <span className="text-sm group-hover:scale-110 transition-transform">✨</span>
          <span className="text-[9px] font-bold flex flex-col items-center leading-none tracking-widest gap-0.5">
            <span>A</span>
            <span>L</span>
            <span>M</span>
            <span>A</span>
          </span>
        </button>
      )}
    </>
  );
};

export default AlmaWidget;