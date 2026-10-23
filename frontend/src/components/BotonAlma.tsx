import React from 'react';
import { motion } from 'framer-motion';

interface BotonAlmaProps {
  onClick: () => void;
}

const BotonAlma: React.FC<BotonAlmaProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-36 right-6 md:bottom-36 md:right-10 z-40 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Hablar con Alma"
    >
      {/* 1. Resplandor exterior (Aura) */}
      <motion.div
        className="absolute inset-0 bg-[#E07A5F]/30 rounded-full blur-xl -z-10"
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

      {/* 2. El Orbe de Cristal */}
      <div className="relative w-full h-full rounded-full bg-white/10 backdrop-blur-md border border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.4)] overflow-hidden flex items-center justify-center">
        
        {/* 3. Luz interior líquida (Fondo cálido) */}
        <motion.div
          className="absolute inset-3 md:inset-4 bg-gradient-to-tr from-[#E07A5F]/50 via-[#F2CC8F]/40 to-[#FDF6EC]/50 opacity-90 mix-blend-multiply"
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

        {/* 4. LA ESTRELLA CENTRAL (Destello de luz) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          animate={{
            scale: [0.6, 1.2, 0.6], // Crece y se encoge
            opacity: [0.7, 1, 0.7], // Late
          }}
          transition={{
            duration: 4, // Velocidad del pulso
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg 
            width="90%" 
            height="90%" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          >
            {/* Rayos principales (Cruz) */}
            <path 
              d="M50 0 C50 45 50 45 100 50 C50 55 50 55 50 100 C50 55 50 55 0 50 C50 45 50 45 50 0 Z" 
              fill="url(#starGradient)" 
            />
            {/* Rayos diagonales más pequeños */}
            <path 
              d="M50 15 C50 45 50 45 85 50 C50 55 50 55 50 85 C50 55 50 55 15 50 C50 45 50 45 50 15 Z" 
              fill="url(#starGradient)" 
              transform="rotate(45 50 50)" 
              opacity="0.7"
            />
            <defs>
              <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="20%" stopColor="#FFF9E6" stopOpacity="1" />
                <stop offset="50%" stopColor="#F2CC8F" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Etiqueta flotante (Tooltip) */}
      <div className="absolute -top-10 md:-top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#3D405B] text-white text-[10px] md:text-xs py-1 px-3 rounded-full whitespace-nowrap shadow-lg pointer-events-none z-20">
        Hablar con Alma
      </div>
    </motion.button>
  );
};

export default BotonAlma;