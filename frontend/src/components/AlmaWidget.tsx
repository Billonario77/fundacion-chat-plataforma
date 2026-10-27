import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BotonAlma from './BotonAlma';
import ChatIA from './ChatIA';

const AlmaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Inicia oculto por defecto (mostrando la pestaña)
  
  // Referencia para el temporizador de 5 segundos
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Función que se ejecuta al hacer clic en la pestañita
  const handleTabClick = () => {
    setIsHidden(false); // Mostramos el orbe

    // Si ya había un temporizador activo, lo limpiamos
    if (timerRef.current) clearTimeout(timerRef.current);

    // Iniciamos el temporizador de 5 segundos
    timerRef.current = setTimeout(() => {
      setIsHidden(true); // Volvemos a ocultar si no se hizo clic
    }, 5000);
  };

  // Función que se ejecuta al hacer clic en el Orbe
  const handleOrbClick = () => {
    // Cancelamos el temporizador porque el usuario sí quiere hablar
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true); // Abrimos el chat
  };

  // Limpiamos el temporizador si el componente se desmonta
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-10 md:right-10 z-[100] sm:w-96 h-[500px] max-h-[85vh] shadow-2xl rounded-2xl bg-white"
          >
            {/* Cuando se cierra el chat, volvemos directamente al estado de la pestaña */}
            <ChatIA onClose={() => {
              setIsOpen(false);
              setIsHidden(true); 
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vela Flotante (Se muestra cuando isHidden es false y el chat está cerrado) */}
      {!isOpen && !isHidden && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-1/2 -translate-y-1/2 right-4 md:right-6 z-50"
        >
          <BotonAlma onClick={handleOrbClick} />
        </motion.div>
      )}

      {/* Pestañita lateral (Se muestra cuando isHidden es true y el chat está cerrado) */}
      {isHidden && !isOpen && (
        <button
          onClick={handleTabClick}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-50 bg-[#E07A5F] text-white py-2 px-1.5 rounded-l-lg shadow-md hover:bg-[#d16a4f] transition-all flex flex-col items-center justify-center gap-1.5 group"
        >
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
          {/* <span className="text-[9px] font-bold flex flex-col items-center leading-none tracking-widest gap-0.5">
            <span>A</span>
            <span>l</span>
            <span>m</span>
            <span>a</span>
          </span>*/}
        </button>
      )}
    </>
  );
};

export default AlmaWidget;