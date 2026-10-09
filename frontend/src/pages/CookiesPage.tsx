import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';
import BotonVolver from '../components/BotonVolver';

const CookiesPage: React.FC = () => {
  const actualizado = '7 de octubre de 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0]">
      {/* Navegación */}
      <nav className="container mx-auto px-4 md:px-6 py-5 flex justify-between items-center gap-3">
        <Logo />
        <BotonVolver />
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-12 md:py-16 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-7xl mb-6"
        >
          🍪
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4"
        >
          Política de Cookies
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[#5D6078] leading-relaxed"
        >
          Última actualización: {actualizado}
        </motion.p>
      </section>

      {/* Contenido */}
      <section className="container mx-auto px-6 pb-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm border border-[#F2CC8F]/40"
        >
          <div className="prose prose-lg max-w-none text-[#3D405B] space-y-6 leading-relaxed">

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">1. ¿Qué son las cookies?</h2>
              <p className="text-[#5D6078]">
                Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio
                web. Sirven para recordar tus preferencias, mantener tu sesión activa y entender cómo usas la
                Plataforma para mejorarla.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">2. Tipos de cookies que usamos</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li>
                  <strong>Estrictamente necesarias:</strong> permiten que la Plataforma funcione correctamente
                  (mantener tu sesión iniciada, recordar preferencias de navegación, evitar errores de seguridad).
                  Estas cookies no requieren consentimiento previo porque son esenciales para el Servicio.
                </li>
                <li>
                  <strong>De rendimiento:</strong> nos ayudan a entender cómo los usuarios interactúan con la
                  Plataforma (páginas más visitadas, errores frecuentes). Esta información es anónima y agregada.
                </li>
                <li>
                  <strong>Funcionales:</strong> recuerdan tus preferencias (idioma, modo de visualización) para
                  ofrecerte una experiencia más personalizada.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">3. Cookies de terceros</h2>
              <p className="text-[#5D6078]">
                Algunos servicios integrados en la Plataforma pueden instalar sus propias cookies cuando interactúas
                con ellos:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2 mt-2">
                <li><strong>Wompi:</strong> al procesar pagos, la pasarela puede establecer cookies de seguridad y antifraude.</li>
                <li><strong>Agora:</strong> al usar videollamadas, puede establecer cookies técnicas para el funcionamiento de la conexión en tiempo real.</li>
                <li><strong>Google Fonts / recursos externos:</strong> pueden registrar tu IP al cargar tipografías o imágenes desde sus servidores.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                Estas cookies son gestionadas por sus respectivos proveedores y se rigen por sus propias políticas de
                privacidad.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">4. Almacenamiento local (localStorage)</h2>
              <p className="text-[#5D6078]">
                Además de cookies, usamos el <strong>almacenamiento local del navegador</strong> (localStorage) para
                guardar de forma segura tu token de autenticación y algunas preferencias de sesión. Esta información
                permanece en tu dispositivo y se borra cuando cierras sesión o limpias la caché del navegador.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">5. Cómo gestionar o eliminar cookies</h2>
              <p className="text-[#5D6078]">
                Puedes controlar y eliminar cookies desde la configuración de tu navegador. Aquí tienes enlaces a las
                guías oficiales:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2 mt-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#E07A5F] hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/borrar-cookies-y-datos-de-sitios-en-firefox" target="_blank" rel="noopener noreferrer" className="text-[#E07A5F] hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/es-co/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#E07A5F] hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#E07A5F] hover:underline">Microsoft Edge</a></li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                <strong>Importante:</strong> si desactivas las cookies estrictamente necesarias, es posible que algunas
                funcionalidades de la Plataforma (como mantener la sesión iniciada o agendar sesiones) no funcionen
                correctamente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">6. Consentimiento</h2>
              <p className="text-[#5D6078]">
                Al continuar navegando por la Plataforma, aceptas el uso de cookies según lo descrito en esta
                política. Puedes revocar tu consentimiento en cualquier momento eliminando las cookies almacenadas en
                tu navegador.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">7. Cambios a esta política</h2>
              <p className="text-[#5D6078]">
                Podemos actualizar esta <strong>Política de Cookies</strong> cuando lo consideremos necesario. La fecha de última
                actualización aparece al inicio de esta página.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">8. Contacto</h2>
              <p className="text-[#5D6078]">
                Si tienes dudas sobre el uso de cookies, escríbenos a{' '}
                <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">
                  contacto@vocesdelalma.com
                </a>{' '}
                o al WhatsApp <strong>+57 302 728 7033</strong>.
              </p>
            </div>

          </div>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default CookiesPage;