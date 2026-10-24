import React from 'react';
import { motion } from 'framer-motion';

interface BotonAlmaProps {
  onClick: () => void;
}

const BotonAlma: React.FC<BotonAlmaProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      // 1. Aumentamos el contenedor un 10% (de w-10 a w-11, y de w-12 a w-14 en desktop)
      className="relative flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-full group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Resplandor exterior (Aura) */}
      <motion.div
        className="absolute inset-0 bg-[#E07A5F]/30 rounded-full blur-md -z-10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* El Orbe de Cristal */}
      <div className="relative w-full h-full rounded-full bg-white/10 backdrop-blur-md border border-white/60 shadow-[0_0_10px_rgba(255,255,255,0.4)] overflow-hidden flex items-center justify-center">
        
        {/* Luz interior líquida */}
        <motion.div
          className="absolute inset-2 md:inset-2.5 bg-gradient-to-tr from-[#E07A5F]/50 via-[#F2CC8F]/40 to-[#FDF6EC]/50 opacity-90 mix-blend-multiply"
          animate={{
            borderRadius: [
              "40% 60% 70% 30% / 40% 50% 60% 50%",
              "60% 40% 30% 70% / 60% 30% 70% 40%",
              "40% 60% 70% 30% / 40% 50% 60% 50%"
            ],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* LA ESTRELLA CENTRAL - Le ponemos un tamaño fijo para que no se estire */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          animate={{
            scale: [0.8, 1.1, 0.8],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Este div fija el tamaño de la estrella independientemente del orbe */}
          <div className="w-6 h-6 md:w-7 md:h-7 drop-shadow-[0_0_8px_rgba(255,230,150,0.8)]">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="30%" stopColor="#FFF9E6" stopOpacity="1" />
                  <stop offset="70%" stopColor="#F2CC8F" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path 
                d="M50 0 L55 40 L90 20 L60 45 L100 50 L60 55 L90 80 L55 60 L50 100 L45 60 L10 80 L40 55 L0 50 L40 45 L10 20 L45 40 Z" 
                fill="url(#starGradient)" 
                filter="url(#glow)"
              />
            </svg>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#3D405B] text-white text-[10px] py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-20">
        Habla con Alma
      </div>
    </motion.button>
  );
};

export default BotonAlma;