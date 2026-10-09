import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';
import BotonVolver from '../components/BotonVolver';

const PrivacidadPage: React.FC = () => {
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
              En cumplimiento de la <strong>Ley 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y
              demás normas que regulan la protección de datos personales en Colombia, <strong>Voces del Alma</strong>,
              marca comercial operada por <strong> Biozynex SAS</strong>, informa a sus usuarios cómo recolecta,
              utiliza, almacena, protege y trata la información personal suministrada a través de la Plataforma.
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">1. Responsable del Tratamiento</h2>
              <p className="text-[#5D6078]">
                El responsable del tratamiento de los datos personales es <strong>Biozynex SAS</strong>, titular y
                operador de la marca comercial <strong>Voces del Alma</strong>.
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-3">
                <li>Correo electrónico: <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">contacto@vocesdelalma.com</a></li>
                <li>WhatsApp: <strong>+57 302 728 7033</strong></li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">2. Datos que recolectamos</h2>
              <p className="text-[#5D6078] mb-3">Podemos recolectar las siguientes categorías de información:</p>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">2.1 Datos de identificación</h3>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1">
                <li>Nombre y apellidos.</li>
                <li>Correo electrónico.</li>
                <li>Número de teléfono.</li>
                <li>Ciudad de residencia.</li>
                <li>Edad.</li>
                <li>Número de documento de identidad (cuando sea requerido).</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">2.2 Datos sensibles (voluntarios)</h3>
              <p className="text-[#5D6078]">
                Información relacionada con tu estado emocional, experiencias personales, bienestar emocional o
                procesos de acompañamiento que decidas compartir voluntariamente durante las sesiones o mediante
                formularios de la Plataforma.
              </p>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">2.3 Datos de uso</h3>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1">
                <li>Fechas y horarios de sesiones agendadas.</li>
                <li>Historial de sesiones.</li>
                <li>Mensajes intercambiados dentro de la Plataforma.</li>
                <li>Interacciones y participación en los servicios ofrecidos.</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">2.4 Datos de pago</h3>
              <p className="text-[#5D6078]">
                Los pagos son procesados por proveedores externos autorizados, como <strong>Wompi</strong>.
                <strong> Biozynex SAS</strong> no almacena datos completos de tarjetas de crédito, débito ni información financiera
                sensible.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">3. Finalidad del Tratamiento</h2>
              <p className="text-[#5D6078] mb-2">Los datos personales recolectados serán utilizados para:</p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li>Prestar los servicios de acompañamiento emocional y escucha activa ofrecidos por Voces del Alma.</li>
                <li>Gestionar el registro, autenticación y administración de usuarios.</li>
                <li>Programar, administrar y hacer seguimiento a sesiones.</li>
                <li>Procesar pagos y gestionar facturación.</li>
                <li>Enviar confirmaciones, recordatorios y comunicaciones relacionadas con el Servicio.</li>
                <li>Cumplir obligaciones legales, contables, fiscales y contractuales.</li>
                <li>Resolver consultas, solicitudes, peticiones o reclamaciones.</li>
                <li>Mejorar la calidad de la Plataforma mediante análisis estadísticos e información anonimizada.</li>
                <li>Detectar actividades fraudulentas, usos indebidos o incidentes de seguridad.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                El suministro de datos sensibles es <strong>voluntario</strong>. Ningún usuario está obligado a
                proporcionar información relacionada con su salud física, emocional o mental.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">4. Tratamiento de Datos Sensibles</h2>
              <p className="text-[#5D6078]">
                De conformidad con la Ley 1581 de 2012, los datos relacionados con la salud física, mental o emocional
                constituyen <strong>datos sensibles</strong> y requieren autorización expresa.
              </p>
              <p className="text-[#5D6078] mt-3">
                Al utilizar la Plataforma y compartir voluntariamente este tipo de información, autorizas de manera
                libre, previa, expresa e informada a <strong> Biozynex SAS</strong> para tratar dichos datos exclusivamente con la
                finalidad de prestar los servicios ofrecidos por Voces del Alma.
              </p>
              <p className="text-[#5D6078] mt-3">
                La negativa a suministrar datos sensibles no impedirá el acceso a la Plataforma, aunque puede limitar
                la personalización o profundidad del acompañamiento recibido.
              </p>
              <p className="text-[#5D6078] mt-3">
                Voces del Alma ofrece espacios de escucha activa, orientación y acompañamiento emocional. La
                información suministrada por los usuarios no será utilizada para realizar diagnósticos médicos,
                psicológicos o psiquiátricos ni para emitir conceptos clínicos, salvo que el servicio sea prestado por
                profesionales legalmente habilitados para ello.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">5. Menores de Edad</h2>
              <p className="text-[#5D6078]">
                Voces del Alma <strong>no está dirigida principalmente a menores de edad</strong>.
              </p>
              <p className="text-[#5D6078] mt-3">
                En caso de que un menor de 18 años utilice la Plataforma, será necesaria la autorización previa,
                expresa y verificable de su representante legal.
              </p>
              <p className="text-[#5D6078] mt-3">
                <strong> Biozynex SAS</strong> adoptará medidas razonables para verificar dicha autorización antes de permitir el
                registro o acceso a servicios que impliquen tratamiento de datos personales.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">6. Anonimato</h2>
              <p className="text-[#5D6078]">
                La Plataforma permite el registro mediante un <strong>NickName o alias</strong>.
              </p>
              <p className="text-[#5D6078] mt-3">
                Cuando utilices esta modalidad, tu identidad real no será visible para otros usuarios ni para los
                guías, salvo cuando sea estrictamente necesario para la prestación del Servicio.
              </p>
              <p className="text-[#5D6078] mt-3">
                No obstante, por razones de seguridad, cumplimiento legal y protección de los usuarios, <strong> Biozynex SAS </strong>
                podrá conservar internamente información que permita identificar al titular en situaciones
                excepcionales, tales como:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Orden judicial.</li>
                <li>Requerimiento de autoridad competente.</li>
                <li>Riesgo grave para la vida o integridad de una persona.</li>
                <li>Emergencia médica o situación crítica.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">7. Registro de Conversaciones</h2>
              <p className="text-[#5D6078]">
                Los mensajes intercambiados dentro de la Plataforma podrán ser almacenados y tratados con las
                siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Garantizar la continuidad del servicio.</li>
                <li>Atender solicitudes o reclamaciones.</li>
                <li>Investigar incidentes de seguridad.</li>
                <li>Cumplir obligaciones legales.</li>
                <li>Mejorar la calidad del acompañamiento ofrecido.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                <strong> Biozynex SAS</strong> implementará medidas razonables para proteger la confidencialidad de estas comunicaciones.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">8. Compartición de Información con Terceros</h2>
              <p className="text-[#5D6078]">
                Podremos compartir información únicamente cuando sea necesario para la operación de la Plataforma o
                por obligación legal.
              </p>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">Proveedores tecnológicos</h3>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1">
                <li><strong>Wompi</strong>, para el procesamiento de pagos.</li>
                <li><strong>Render y Netlify</strong>, para alojamiento e infraestructura tecnológica.</li>
                <li>Proveedores SMTP o servicios de correo electrónico transaccional.</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#3D405B] mt-4 mb-2">Autoridades competentes</h3>
              <p className="text-[#5D6078]">
                Cuando exista obligación legal, orden judicial o requerimiento formal de autoridad competente.
              </p>

              <p className="text-[#5D6078] mt-3">
                <strong> Biozynex SAS </strong>cumpliendo las normas legales <strong>no vende, comercializa, alquila, ni cede bases de datos personales</strong> a
                terceros para fines comerciales.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">9. Transferencia Internacional de Datos</h2>
              <p className="text-[#5D6078]">
                Algunos proveedores tecnológicos utilizados por la Plataforma pueden almacenar o procesar información
                en servidores ubicados fuera de Colombia.
              </p>
              <p className="text-[#5D6078] mt-3">
                Al aceptar esta <strong>Política de Privacidad </strong>autorizas dichas transferencias internacionales, las cuales se
                realizarán aplicando medidas razonables de seguridad, confidencialidad e integridad de la información.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">10. Conservación de los Datos</h2>
              <p className="text-[#5D6078]">
                Los datos personales serán conservados mientras exista una relación activa con el usuario y
                posteriormente durante el tiempo necesario para:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Cumplir obligaciones legales.</li>
                <li>Atender requerimientos de autoridades.</li>
                <li>Resolver controversias o reclamaciones.</li>
                <li>Cumplir obligaciones contables, tributarias o contractuales.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                Puedes solicitar la eliminación de tu cuenta en cualquier momento. Sin embargo, algunos datos podrán
                mantenerse durante los plazos exigidos por la legislación aplicable.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">11. Seguridad de la Información</h2>
              <p className="text-[#5D6078]">
                <strong> Biozynex SAS</strong> implementa medidas técnicas, administrativas y organizativas razonables para proteger los
                datos personales, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Conexiones cifradas mediante HTTPS/TLS.</li>
                <li>Almacenamiento seguro de contraseñas mediante algoritmos hash.</li>
                <li>Control de acceso basado en roles.</li>
                <li>Monitoreo de acceso a sistemas.</li>
                <li>Copias de respaldo.</li>
                <li>Infraestructura en la nube con estándares de seguridad reconocidos.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                A pesar de ello, ningún sistema tecnológico puede garantizar seguridad absoluta frente a todos los
                riesgos existentes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">12. Derechos del Titular de los Datos</h2>
              <p className="text-[#5D6078] mb-2">Como titular de los datos personales tienes derecho a:</p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1">
                <li>Conocer la información que tenemos sobre ti.</li>
                <li>Actualizar o corregir datos inexactos.</li>
                <li>Solicitar prueba de la autorización otorgada.</li>
                <li>Revocar la autorización concedida.</li>
                <li>Solicitar la supresión de tus datos cuando sea procedente.</li>
                <li>Ser informado sobre el uso dado a tu información.</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                Para ejercer estos derechos deberás enviar una solicitud a:{' '}
                <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">
                  contacto@vocesdelalma.com
                </a>
              </p>
              <p className="text-[#5D6078] mt-3">La solicitud deberá incluir:</p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Nombre completo.</li>
                <li>Datos de contacto.</li>
                <li>Descripción clara de la petición.</li>
                <li>Documentos necesarios para verificar la identidad del solicitante.</li>
              </ul>
              <p className="text-[#5D6078] mt-3">
                <strong> Biozynex SAS</strong> responderá dentro de los plazos establecidos por la legislación colombiana.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">13. Cambios a esta Política</h2>
              <p className="text-[#5D6078]">
                <strong> Biozynex SAS</strong> podrá modificar esta Política de Privacidad en cualquier momento.
              </p>
              <p className="text-[#5D6078] mt-3">
                Las modificaciones serán publicadas en la Plataforma indicando su fecha de actualización. Cuando los
                cambios sean sustanciales, se informará a los usuarios mediante correo electrónico o notificaciones
                dentro del Servicio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">14. Vigencia</h2>
              <p className="text-[#5D6078]">
                La presente Política de Privacidad entra en vigencia a partir de su publicación y permanecerá vigente
                hasta que sea modificada o sustituida por una versión posterior.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">15. Contacto</h2>
              <p className="text-[#5D6078]">
                Si tienes preguntas relacionadas con el tratamiento de datos personales o con esta <strong>Política de Privacidad </strong>, 
                puedes comunicarte a través de:
              </p>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-1 mt-2">
                <li>Correo: <a href="mailto:contacto@vocesdelalma.com" className="text-[#E07A5F] hover:underline">contacto@vocesdelalma.com</a></li>
                <li>WhatsApp: <strong>+57 302 728 7033</strong></li>
              </ul>
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