import React, { useEffect, useState } from 'react';

const FloatingButtons: React.FC = () => {
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false);

  // Detectar scroll para mostrar/ocultar el botón "Volver arriba"
  useEffect(() => {
    const handleScroll = () => {
      setMostrarVolverArriba(window.scrollY > 300);
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

  const whatsappUrl = 'https://wa.me/573027287033?text=' + encodeURIComponent('Hola, me gustaría más información sobre Fundación Voces del Alma 💛');

  return (
    <>
      {/* Contenedor flotante en la esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        
        {/* Botón Volver arriba (solo visible al hacer scroll) */}
        {mostrarVolverArriba && (
          <button
            onClick={volverArriba}
            className="w-14 h-14 rounded-full bg-[#3D405B] text-white shadow-lg hover:bg-[#2a2d3f] transition-all hover:scale-110 flex items-center justify-center text-2xl animate-fadeIn"
            title="Volver arriba"
            aria-label="Volver arriba"
          >
            ⬆️
          </button>
        )}

        {/* Botón WhatsApp (siempre visible) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ea855] transition-all hover:scale-110 flex items-center justify-center text-3xl relative group"
          title="Escríbenos por WhatsApp"
          aria-label="Escríbenos por WhatsApp"
        >
          💬
          
          {/* Tooltip al hacer hover */}
          <span className="absolute right-full mr-3 bg-[#3D405B] text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¿Necesitas ayuda? Escríbenos
          </span>

          {/* Pulso animado */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none"></span>
        </a>
      </div>
    </>
  );
};

export default FloatingButtons;