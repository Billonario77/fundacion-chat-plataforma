import React, { useEffect, useState } from 'react';

const ScrollToTop: React.FC = () => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setMostrar(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const volverArriba = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!mostrar) return null;

  return (
    <button
      onClick={volverArriba}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#E07A5F] border-0 border-[#] text-[#FFFFFF] shadow-lg hover:bg-[#3D405B] hover:text-white transition-all hover:scale-110 flex items-center justify-center animate-fadeIn group"
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      {/* Icono de flecha clásico (chevron up) */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <polyline points="6 15 12 9 18 15"></polyline>
      </svg>
    </button>
  );
};

export default ScrollToTop;