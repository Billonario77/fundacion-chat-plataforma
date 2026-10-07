import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';

const PrivacidadPage: React.FC = () => {
  const actualizado = '7 de octubre de 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0]">
      {/* Navegación */}
      <nav className="container mx-auto px-4 md:px-6 py-5 flex justify-between items-center gap-3">
        <Logo />
        <Link
          to="/"
          className="text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors flex items-center gap-2 flex-shrink-0"
        >
          ← Volver
        </Link>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-12 md:py-16 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-7xl mb-6"
        >
          🔒
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4"
        >
          Política de Privacidad
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

            <div className="bg-[#F2CC8F]/20 border border-[#F2CC8F]/50 rounded-2xl p-4 text-sm text-[#3D405B]">
              En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong> de
              Colombia (régimen de protección de datos personales), la Fundación Voces del Alma te informa cómo
              recolecta, usa, almacena y protege tu información personal.
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">1. Responsable del tratamiento</h2>
              <p className="text-[#5D6078]">
                <strong>Fundación Voces del Alma</strong><br />
                Correo: <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">contacto@vocesdelalma.com</a><br />
                WhatsApp: +57 302 728 7033
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">2. Datos que recolectamos</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li><strong>Datos de identificación:</strong> nombre, correo electrónico, teléfono, ciudad, edad, cédula (opcional).</li>
                <li><strong>Datos sensibles (voluntarios):</strong> información relacionada con tu estado emocional o proceso de sanación, que compartes libremente en las sesiones o en formularios.</li>
                <li><strong>Datos de uso:</strong> fechas y horas de sesiones agendadas, mensajes intercambiados en el chat, participaciones en la Plataforma.</li>
                <li><strong>Datos de pago:</strong> procesados directamente por Wompi. La Fundación <strong>no almacena</strong> datos de tarjetas ni información financiera completa.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">3. Finalidad del tratamiento</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li>Prestar el servicio de acompañamiento emocional y escucha activa.</li>
                <li>Gestionar el agendamiento, pago y seguimiento de tus sesiones.</li>
                <li>Enviarte recordatorios, confirmaciones y notificaciones relacionadas con el Servicio.</li>
                <li>Cumplir con obligaciones legales, contables y tributarias.</li>
                <li>Mejorar la calidad del Servicio mediante análisis internos anonimizados.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">4. Datos sensibles</h2>
              <p className="text-[#5D6078]">
                De acuerdo con la Ley 1581, los datos relacionados con la salud física o mental son <strong>datos
                sensibles</strong> y requieren consentimiento expreso. Al usar la Plataforma, autorizas de manera libre,
                previa, expresa e informada el tratamiento de estos datos con la única finalidad de prestarte el
                Servicio. Puedes negarte a compartir información sensible y aun así acceder a la Plataforma; sin
                embargo, esto puede limitar la profundidad del acompañamiento.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">5. Menores de edad</h2>
              <p className="text-[#5D6078]">
                El tratamiento de datos de menores de 18 años requiere la autorización previa de su representante
                legal. La Fundación adoptará medidas razonables para verificar dicha autorización antes de permitir el
                registro de un menor.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">6. Anonimato</h2>
              <p className="text-[#5D6078]">
                Puedes registrarte en <strong>modo anónimo</strong>. En ese caso, tu nombre real no será visible para
                los guías ni otros usuarios. Sin embargo, por razones de seguridad y obligaciones legales, la Fundación
                conserva internamente la información necesaria para identificarte en casos excepcionales (orden
                judicial, riesgo vital, emergencia médica).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">7. Con quién compartimos tu información</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li><strong>Wompi:</strong> para procesar pagos. Solo compartimos el monto y la referencia de la transacción.</li>
                <li><strong>Render y Netlify:</strong> proveedores de infraestructura donde se aloja la Plataforma. Los datos se almacenan cifrados en sus servidores.</li>
                <li><strong>Nodemailer / proveedor SMTP:</strong> para enviar correos transaccionales.</li>
                <li><strong>Autoridades competentes:</strong> únicamente ante requerimiento legal.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                <strong>No vendemos, alquilamos ni comercializamos</strong> tu información con terceros.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">8. Conservación de los datos</h2>
              <p className="text-[#5D6078]">
                Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para cumplir obligaciones
                legales. Puedes solicitar la eliminación de tu cuenta en cualquier momento; algunos datos podrán
                conservarse durante los plazos legales exigidos (por ejemplo, información contable).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">9. Seguridad</h2>
              <p className="text-[#5D6078]">
                Implementamos medidas técnicas y organizativas para proteger tu información: cifrado HTTPS, contraseñas
                hasheadas, control de acceso por roles y servidores en la nube con estándares de seguridad. Ningún
                sistema es 100% infalible, pero trabajamos continuamente para mantener tus datos seguros.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">10. Tus derechos como titular</h2>
              <p className="text-[#5D6078]">De acuerdo con la Ley 1581, tienes derecho a:</p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2 mt-2">
                <li><strong>Conocer</strong> qué datos tenemos sobre ti.</li>
                <li><strong>Actualizar</strong> o rectificar tu información.</li>
                <li><strong>Solicitar prueba</strong> de la autorización otorgada.</li>
                <li><strong>Revocar</strong> la autorización o solicitar la supresión de tus datos.</li>
                <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                Para ejercer estos derechos, escríbenos a{' '}
                <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">
                  contacto@vocesdelalma.com
                </a>. Responderemos en un plazo máximo de 15 días hábiles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">11. Cambios a esta política</h2>
              <p className="text-[#5D6078]">
                Podemos actualizar esta Política en cualquier momento. Publicaremos la fecha de actualización en esta
                página y, si los cambios son sustanciales, te notificaremos por correo o dentro de la Plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">12. Contacto</h2>
              <p className="text-[#5D6078]">
                Para cualquier duda sobre el tratamiento de tus datos personales, escríbenos a{' '}
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

export default PrivacidadPage;