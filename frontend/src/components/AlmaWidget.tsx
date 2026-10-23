import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BotonAlma from './BotonAlma';
import ChatIA from './ChatIA';

const AlmaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

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
            className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-10 md:right-10 z-50 sm:w-96 h-[550px] max-h-[85vh] shadow-2xl rounded-2xl bg-white"
          >
            <ChatIA onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor de la Vela Flotante */}
      {!isOpen && !isHidden && (
        <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 group">
          {/* Botón para esconder (La X) - Ahora sí se verá sobre la vela */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="absolute -top-1 -right-1 bg-gray-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-50 shadow-md transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
            title="Esconder a Alma"
          >
            ✕
          </button>

          <BotonAlma onClick={() => setIsOpen(true)} />
        </div>
      )}

            {/* Pestañita lateral (si está escondida) */}
      {isHidden && !isOpen && (
        <button
          onClick={() => setIsHidden(false)}
          className="fixed bottom-24 right-0 md:bottom-10 z-40 bg-[#E07A5F] text-white py-4 px-2 rounded-l-xl shadow-lg hover:bg-[#d16a4f] transition-all flex flex-col items-center justify-center gap-2 group"
          title="Llamar a Alma"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">✨</span>
          {/* Usamos flex-col para apilar las letras de forma natural y derecha */}
          <span className="text-[10px] font-bold flex flex-col items-center leading-none tracking-widest gap-1">
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