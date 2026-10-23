import React from 'react';
import { motion } from 'framer-motion';

interface BotonAlmaProps {
  onClick: () => void;
}

const BotonAlma: React.FC<BotonAlmaProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Hablar con Alma"
    >
      {/* Efecto de resplandor exterior (Siri-like) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-[#E07A5F] via-[#F2CC8F] to-[#81B29A] rounded-full blur-md opacity-70"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
          rotate: [0, 120, 240, 360],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Núcleo del botón (Cristal) */}
      <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 bg-white/30 backdrop-blur-sm rounded-full border border-white/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:bg-white/40 transition-all">
        <span className="text-2xl md:text-3xl drop-shadow-md">✨</span>
      </div>
    </motion.button>
  );
};

export default BotonAlma;