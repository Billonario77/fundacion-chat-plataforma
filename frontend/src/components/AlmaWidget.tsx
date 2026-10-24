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
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-10 md:right-10 z-[100] sm:w-96 h-[500px] max-h-[85vh] shadow-2xl rounded-2xl bg-white"
          >
            <ChatIA onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vela Flotante (Centrada verticalmente) */}
      {!isOpen && !isHidden && (
        <div className="fixed top-1/2 -translate-y-1/2 right-4 md:right-6 z-50 group flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="absolute -top-2 -left-2 bg-gray-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] z-[60] shadow-md transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
            title="Esconder a Alma"
          >
            ✕
          </button>

          <BotonAlma onClick={() => setIsOpen(true)} />
        </div>
      )}

      {/* Pestañita lateral (Centrada verticalmente) */}
      {isHidden && !isOpen && (
        <button
          onClick={() => setIsHidden(false)}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-50 bg-[#E07A5F] text-white py-2 px-1.5 rounded-l-lg shadow-md hover:bg-[#d16a4f] transition-all flex flex-col items-center justify-center gap-1.5 group"
          title="Llamar a Alma"
        >
          {/* Aquí va la estrella de 8 puntas */}
          <div className="w-5 h-5 group-hover:scale-110 transition-transform flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]">
              <defs>
                <radialGradient id="starTabGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="40%" stopColor="#FFF9E6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#F2CC8F" stopOpacity="1" />
                </radialGradient>
              </defs>
              <path 
                d="M50 0 L55 40 L90 20 L60 45 L100 50 L60 55 L90 80 L55 60 L50 100 L45 60 L10 80 L40 55 L0 50 L40 45 L10 20 L45 40 Z" 
                fill="url(#starTabGradient)" 
              />
            </svg>
          </div>
          
          <span className="text-[9px] font-bold flex flex-col items-center leading-none tracking-widest gap-0.5">
            <span>A</span>
            <span>l</span>
            <span>m</span>
            <span>a</span>
          </span>
        </button>
      )}
    </>
  );
};

export default AlmaWidget;