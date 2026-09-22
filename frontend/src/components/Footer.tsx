import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Enlaces legales
  const enlacesLegales = [
    { label: 'Términos y condiciones', to: '/terminos' },
    { label: 'Política de privacidad', to: '/privacidad' },
    { label: 'Política de cookies', to: '/cookies' }
  ];

  return (
    <footer className="bg-[#3D405B] text-white mt-16">
      <div className="container mx-auto px-6 py-12">
        {/* Grid principal */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          
          {/* Columna 1: Logo + descripción */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">💛</span>
              <h3 className="text-xl font-serif font-bold text-white">
                Fundación Voces del Alma
              </h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Un refugio seguro para tu mente y tu espíritu. <br></br>
              Encuentra aquí la guía y la escucha activa <br></br>
              que necesitas para sanar a tu propio ritmo.
            </p>
            <a 
              href="https://www.fva.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#F2CC8F] hover:text-white transition-colors text-sm inline-flex items-center gap-1"
            >
              🌐 www.fva.com
            </a>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="mailto:contacto@fva.com" 
                  className="text-white/70 hover:text-[#F2CC8F] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">📧</span>
                  contacto@fva.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/573027287033" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#F2CC8F] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">📱</span>
                  +57 302 728 7033
                </a>
              </li>
            </ul>

            {/* Redes sociales */}
            <h4 className="text-lg font-semibold text-white mt-6 mb-4">Síguenos</h4>
            <div className="flex gap-3">
              <a 
                href="https://instagram.com/fundacionvocesdelalma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#E07A5F] transition-colors flex items-center justify-center"
                title="Instagram"
              >
                📸
              </a>
              <a 
                href="https://facebook.com/fundacionvocesdelalma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#E07A5F] transition-colors flex items-center justify-center"
                title="Facebook"
              >
                📘
              </a>
              <a 
                href="https://x.com/fundacionvocesdelalma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#E07A5F] transition-colors flex items-center justify-center"
                title="X (antes Twitter)"
              >
                ✖️
              </a>
              <a 
                href="https://youtube.com/@fundacionvocesdelalma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#E07A5F] transition-colors flex items-center justify-center"
                title="YouTube"
              >
                ▶️
              </a>
            </div>
          </div>

          {/* Columna 3: Enlaces + Acciones */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces</h4>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link to="/" className="text-white/70 hover:text-[#F2CC8F] transition-colors">
                  → Inicio
                </Link>
              </li>
              <li>
                <Link to="/testimonios" className="text-white/70 hover:text-[#F2CC8F] transition-colors">
                  → Testimonios
                </Link>
              </li>
              <li>
                <Link to="/donar" className="text-white/70 hover:text-[#F2CC8F] transition-colors">
                  → Donar
                </Link>
              </li>
            </ul>

            <h4 className="text-lg font-semibold text-white mb-4">Ayuda</h4>
            <ul className="space-y-3 text-sm">
              {enlacesLegales.map((enlace) => (
                <li key={enlace.to}>
                  <Link 
                    to={enlace.to} 
                    className="text-white/70 hover:text-[#F2CC8F] transition-colors"
                  >
                    → {enlace.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p className="text-center md:text-left">
              © {currentYear} &nbsp;  
              <a
                href="https://fundacion-chat-frontend-api.netlify.app/"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#F2CC8F] hover:text-white transition-colors font-semibold"
              >
                Fundación Voces del Alma. 
              </a> 
              &nbsp;Todos los derechos reservados.
            </p>
            <p className="text-center md:text-center">
              Pagina creada por:{' '}
              <a 
                href="https://www.arjosoft.com.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#F2CC8F] hover:text-white transition-colors font-semibold"
              >
                Arjosoft S.A.
              </a>
            </p>
            <p className="text-center md:text-right">
              Tu Voz nos importa, por eso queremos escucharte.💛
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;