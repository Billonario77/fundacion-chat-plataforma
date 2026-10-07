import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';

const TerminosPage: React.FC = () => {
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
          📋
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4"
        >
          Términos y Condiciones
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
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">1. Aceptación de los términos</h2>
              <p className="text-[#5D6078]">
                Al acceder y utilizar la plataforma <strong>Voces del Alma</strong> operada por <strong>Biozynex SAS </strong>
                (en adelante, "Voces del Alma", "la Plataforma" o "el Servicio"), aceptas de manera libre, expresa e informada 
                los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos abstenerte de usar la Plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">2. Naturaleza del servicio</h2>
              <p className="text-[#5D6078]">
                La Plataforma ofrece <strong>espacios de acompañamiento emocional y escucha activa</strong> a través de guías
                capacitados. El Servicio <strong>NO constituye atención médica, psiquiátrica ni psicológica clínica</strong>,
                y <strong>no sustituye tratamientos profesionales</strong> ni la atención de urgencias.
              </p>
              <p className="text-[#5D6078] mt-3">
                Si estás atravesando una crisis con riesgo para tu vida o la de terceros, por favor acude de inmediato a
                los servicios de emergencia locales (<strong>línea 123</strong> en Colombia) o a un centro hospitalario cercano.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">3. Requisitos de uso</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li>Ser mayor de edad (<strong>18 años</strong>) para registrarse de forma autónoma.</li>
                <li>Los menores de edad solo podrán acceder con autorización expresa de su representante legal.</li>
                <li>Registrarte con información veraz y mantener la confidencialidad de tu contraseña.</li>
                <li>Hacer un uso respetuoso del Servicio, sin afectar a otros usuarios ni a los guías.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">4. Anonimato</h2>
              <p className="text-[#5D6078]">
                Sin embargo, para cumplir obligaciones legales, de seguridad y de protección de los usuarios, 
                <strong> Biozynex SAS</strong>, como operador de la Plataforma <strong>Voces del Alma</strong>,
                conserva un registro interno que permite la identificación en circunstancias excepcionales, 
                tales como una orden judicial o una situación de riesgo grave para la vida o integridad de una persona.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">5. Pagos y sesiones</h2>
              <ul className="list-disc pl-6 text-[#5D6078] space-y-2">
                <li>Las sesiones tendrán un costo que se informa antes de agendar y pagar.</li>
                <li>Los pagos se procesan a través de <strong>Wompi</strong> (pasarela de pagos de Bancolombia). <strong>Biozynex SAS</strong> no almacena datos 
                    completos de tarjetas de crédito o débito y se apoya en proveedores de pago certificados para el procesamiento de las transacciones.</li>
                <li>Podrás cancelar una sesión sin penalización hasta <strong>2 horas antes</strong> de su inicio.</li>
                <li>Si no realizas el pago <strong>1 hora antes</strong> del inicio (o 5 minutos después del inicio si la sesión fue agendada con menos de 70 minutos de anticipación), la sesión se cancela automáticamente y se genera una multa equivalente al <strong>50% del valor de la sesión</strong>, que se sumará a tu próxima sesión.</li>
                <li>Las multas son configurables por <strong>Biozynex SAS</strong> y se informan oportunamente en la Plataforma.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">6. Convenios con empresas e instituciones</h2>
              <p className="text-[#5D6078]">
                <strong>Biozynex SAS</strong> a través de la marca <strong>Voces del Alma</strong>, puede establecer convenios con empresas, colegios, universidades, fundaciones, entidades estatales y organizaciones privadas.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">7. Conducta del usuario</h2>
              <p className="text-[#5D6078]">
                El usuario se compromete a no usar la Plataforma para enviar contenido ofensivo, discriminatorio,
                violento, sexual, ilegal o que vulnere derechos de terceros. <strong>Voces del Alma</strong> podrá suspender temporal o definitivamente las cuentas que incumplan estas normas.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">8. Propiedad intelectual</h2>
              <p className="text-[#5D6078]">
                Todos los contenidos de la Plataforma, incluyendo textos, diseños, logotipos, software, bases de datos, interfaces gráficas, nombres comerciales y demás elementos, 
                son propiedad de <strong>Biozynex SAS</strong> o se utilizan bajo licencia o autorización de sus respectivos titulares. No podrán reproducirse sin permiso previo y por escrito.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">9. Limitación de responsabilidad</h2>
              <p className="text-[#5D6078]">
                <strong>Biozynex SAS</strong> realiza sus mejores esfuerzos para ofrecer un Servicio de calidad, pero no garantiza
                resultados específicos ni se hace responsable por decisiones personales tomadas a partir del
                acompañamiento recibido. La responsabilidad de <strong>Biozynex SAS</strong> se limita al valor efectivamente pagado por
                el usuario por el Servicio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">10. Modificaciones</h2>
              <p className="text-[#5D6078]">
                <strong>Biozynex SAS</strong> podrá modificar estos Términos en cualquier momento. Las modificaciones se publicarán en
                esta página con la fecha de actualización. El uso continuado del Servicio implica su aceptación.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">11. Ley aplicable y jurisdicción</h2>
              <p className="text-[#5D6078]">
                Estos Términos se rigen por las leyes de la <strong>República de Colombia</strong>. Cualquier
                controversia se someterá a los jueces competentes del domicilio de <strong>Biozynex SAS</strong>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-[#3D405B] mb-3">12. Contacto</h2>
              <p className="text-[#5D6078]">
                Para cualquier consulta sobre estos Términos, escríbenos a{' '}
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

export default TerminosPage;