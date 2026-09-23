import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { testimoniosService, TestimonioPublico } from '../services/testimoniosService';

const HomePage: React.FC = () => {
  const [testimoniosHome, setTestimoniosHome] = useState<TestimonioPublico[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await testimoniosService.listarPublicos({ limit: 2 });
        if (activo) setTestimoniosHome(data.testimonios);
      } catch (err) {
        console.error('Error al cargar testimonios del home:', err);
      }
    })();
    return () => { activo = false; };
  }, []);

    const EMOJIS = ['🕊️', '🌙', '☀️', '✨', '🍃', '💫', '🕯️', '🌟'];
    const getAvatar = (t: TestimonioPublico) =>
      t.es_anonimo ? '🍀' : EMOJIS[t.id % EMOJIS.length];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0]">
      {/* ============================================ */}
      {/* NAVEGACIÓN */}
      {/* ============================================ */}
      <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
        <div className="text-2xl font-serif font-bold text-[#3D405B]">
          Fundación Apoyo
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/donar"
            className="text-[#3D405B] hover:text-[#E07A5F] transition-colors text-sm font-medium"
          >
            Donar
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors px-4 py-2 rounded-full border border-[#3D405B]/20 hover:border-[#E07A5F]/40"
          >
            <span>🔑</span>
            Ingresar
          </Link>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-12 md:py-20 relative">
        {/* Luz de fondo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#F2CC8F]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 relative">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-2 bg-[#F2CC8F]/30 rounded-full text-sm text-[#3D405B] font-medium mb-6"
            >
              🌅 Un espacio para respirar y sanar
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#3D405B] leading-tight"
            >
              Hay un lugar donde tu voz{' '}
              <span className="text-[#E07A5F]">será escuchada</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-[#5D6078] mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              No tienes que cargar todo solo. Aquí encontrarás guía, escucha y un espacio seguro para recomenzar, a tu propio ritmo. Mereces sentir paz.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/login"
                className="bg-[#E07A5F] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-[#d16a4f] transition-all hover:scale-105 shadow-lg hover:shadow-xl shadow-[#E07A5F]/30"
              >
                🌱 Agendar una Sesión
              </Link>
              <Link
                to="/testimonios"
                className="border-2 border-[#81B29A] text-[#81B29A] px-8 py-4 rounded-full text-lg font-medium hover:bg-[#81B29A]/10 transition-all"
              >
                ✨ Escuchar Historias
              </Link>
            </motion.div>

            {/* Datos de confianza */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10 flex gap-8 justify-center lg:justify-start text-sm text-[#5D6078]"
            >
              <div>
                <div className="text-2xl font-serif font-bold text-[#3D405B]">+500</div>
                <div>Personas acompañadas</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-[#3D405B]">100%</div>
                <div>Confidencial</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-[#3D405B]">24/7</div>
                <div>Disponible</div>
              </div>
            </motion.div>
          </div>

          {/* Ilustración */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex justify-center relative"
          >
            <div className="relative">
              {/* Círculo principal con degradado amanecer */}
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-[#F2CC8F] via-[#E07A5F]/40 to-[#81B29A]/40 flex items-center justify-center shadow-2xl shadow-[#F2CC8F]/50">
                <span className="text-9xl md:text-[10rem]">🕊️</span>
              </div>
              {/* Elementos flotantes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl"
              >
                ☀️
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl"
              >
                🌿
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FRASE INSPIRADORA */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-2xl md:text-3xl font-serif text-[#3D405B] italic leading-relaxed">
            "No estás solo. A veces, el primer paso es simplemente{' '}
            <span className="text-[#E07A5F] not-italic font-bold">hablar</span>."
          </p>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* SERVICIOS */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-[#3D405B] mb-4">
          Cómo podemos acompañarte
        </h2>
        <p className="text-center text-[#5D6078] mb-12 max-w-2xl mx-auto">
          Cada persona es única. Elegimos el camino que mejor se adapte a ti.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🤝',
              title: 'Apoyo Personalizado',
              description: 'Espacios de escucha profunda adaptados a tu historia y necesidades.',
              color: 'bg-[#E07A5F]/10'
            },
            {
              icon: '🌿',
              title: 'Crisis Inmediata',
              description: 'Atención rápida y contenedora para momentos de desborde emocional.',
              color: 'bg-[#81B29A]/10'
            },
            {
              icon: '💛',
              title: 'Seguimiento Continuo',
              description: 'Acompañamiento sostenido para construir bienestar a largo plazo.',
              color: 'bg-[#F2CC8F]/30'
            }
          ].map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${service.color} backdrop-blur-sm rounded-3xl p-8 text-center shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-white/60`}
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-[#3D405B]">{service.title}</h3>
              <p className="text-[#5D6078] mt-2">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* DONACIONES */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-[#E07A5F] to-[#81B29A] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]"></div>
          </div>
          <div className="relative">
            <div className="text-6xl mx-auto mb-4">💝</div>
            <h2 className="text-3xl md:text-4xl font-serif">Tu apoyo hace la diferencia</h2>
            <p className="text-white/90 mt-4 max-w-xl mx-auto text-lg">
              Con tu donación, más personas encontrarán un lugar seguro para sanar. Juntos construimos esperanza.
            </p>
            <Link
              to="/donar"
              className="inline-block mt-6 bg-white text-[#E07A5F] px-10 py-4 rounded-full text-lg font-medium hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
            >
              💛 Donar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIOS */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-[#3D405B] mb-4">
          Voces que inspiran
        </h2>
        <p className="text-center text-[#5D6078] mb-12 max-w-2xl mx-auto">
          Historias reales de personas que dieron el primer paso.
        </p>

        {testimoniosHome.length === 0 ? (
          <p className="text-center text-[#5D6078] italic py-8">
            Aún no hay historias publicadas. ¡Sé la primera persona en compartir la tuya!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {testimoniosHome.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all border border-[#F2CC8F]/40"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#F2CC8F]/40 flex items-center justify-center text-2xl flex-shrink-0">
                    {getAvatar(t)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#3D405B] truncate">{t.autor}</p>
                    {(t.edad || t.ciudad) && (
                      <p className="text-xs text-[#5D6078]">
                        {t.edad && <span>{t.edad} años</span>}
                        {t.edad && t.ciudad && <span> • </span>}
                        {t.ciudad && <span>📍 {t.ciudad}</span>}
                      </p>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-serif text-[#3D405B] mb-2">
                  "{t.titulo}"
                </h3>
                <p className="text-[#3D405B] italic leading-relaxed line-clamp-4">
                  {t.contenido}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/testimonios"
            className="inline-flex items-center gap-2 text-[#E07A5F] hover:text-[#d16a4f] transition-colors font-medium"
          >
            Ver más historias →
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="text-5xl mb-4">🌅</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#3D405B] mb-4">
            Hoy puede ser el día en que todo empiece a cambiar
          </h2>
          <p className="text-lg text-[#5D6078] max-w-2xl mx-auto mb-8">
            Da el primer paso. Estamos aquí para acompañarte.
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#E07A5F] text-white px-12 py-4 rounded-full text-lg font-medium hover:bg-[#d16a4f] transition-all hover:scale-105 shadow-lg shadow-[#E07A5F]/30"
          >
            Comenzar Ahora →
          </Link>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer />
      <WhatsAppButton />

    </div>
  );
};

export default HomePage;