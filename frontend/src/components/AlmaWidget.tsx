import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BotonAlma from './BotonAlma';
import ChatIA from './ChatIA';

const AlmaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // Nuevo estado para esconder

  return (
    <>
      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] shadow-2xl rounded-2xl"
          >
            <ChatIA onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* La Vela Flotante (solo si NO está abierto el chat y NO está escondida) */}
      {!isOpen && !isHidden && (
        <div className="relative group">
          <BotonAlma onClick={() => setIsOpen(true)} />
          
          {/* Botoncito pequeño para esconder a Alma */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita que se abra el chat si se hace clic en la "X"
              setIsHidden(true);
            }}
            className="absolute top-0 right-0 bg-gray-500/50 hover:bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] z-50 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Esconder a Alma"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pestañita lateral (si está escondida) */}
      {isHidden && !isOpen && (
        <button
          onClick={() => setIsHidden(false)}
          className="fixed bottom-24 right-0 md:bottom-10 z-40 bg-[#E07A5F] text-white py-3 px-2 rounded-l-xl shadow-lg hover:bg-[#d16a4f] transition-all flex flex-col items-center gap-1 group"
          title="Llamar a Alma"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
          <span className="text-[10px] font-bold writing-mode-vertical-rl rotate-180 tracking-widest">
            ALMA
          </span>
        </button>
      )}
    </>
  );
};

export default AlmaWidget;