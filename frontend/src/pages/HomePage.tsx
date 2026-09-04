import React from 'react';
import { Link } from 'react-router-dom';
import { FaHandsHelping, FaLeaf, FaHeart, FaDonate, FaMicrophone, FaArrowRight } from 'react-icons/fa';
import { FiLogIn } from 'react-icons/fi';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0eb] via-[#eef5f0] to-[#f5f0eb]">
      {/* ============================================ */}
      {/* NAVEGACIÓN */}
      {/* ============================================ */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-serif font-bold text-[#2d4a3e]">
          Fundación Apoyo
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/donaciones"
            className="text-[#2d4a3e] hover:text-[#4a7c5e] transition-colors text-sm font-medium"
          >
            Donar
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-[#2d4a3e] hover:text-[#4a7c5e] transition-colors px-4 py-2 rounded-full border border-[#2d4a3e]/20 hover:border-[#2d4a3e]/40"
          >
            <FiLogIn />
            Ingresar
          </Link>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Texto */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#2d4a3e] leading-tight"
            >
              Un refugio seguro para tu mente y tu espíritu
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-[#4a6b5a] mt-6 max-w-xl mx-auto lg:mx-0"
            >
              Encuentra la guía y la escucha activa que necesitas para sanar a tu propio ritmo.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/solicitar-turno"
                className="bg-[#2d4a3e] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-[#3d6b55] transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Agendar una Sesión
              </Link>
              <Link
                to="/testimonios"
                className="border-2 border-[#2d4a3e]/30 text-[#2d4a3e] px-8 py-4 rounded-full text-lg font-medium hover:bg-[#2d4a3e]/5 transition-all"
              >
                Escuchar Historias
              </Link>
            </motion.div>
          </div>

          {/* Ilustración */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex justify-center"
          >
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-[#2d4a3e]/10 to-[#4a7c5e]/20 flex items-center justify-center">
              <span className="text-8xl md:text-9xl">🤝</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SERVICIOS */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-[#2d4a3e] mb-12">
          Acompañamiento en cada paso
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaHandsHelping className="text-4xl text-[#2d4a3e]" />,
              title: 'Apoyo Personalizado',
              description: 'Espacios de escucha profunda adaptados a tu historia y necesidades.'
            },
            {
              icon: <FaLeaf className="text-4xl text-[#2d4a3e]" />,
              title: 'Crisis Inmediata',
              description: 'Atención rápida y contenedora para momentos de desborde emocional.'
            },
            {
              icon: <FaHeart className="text-4xl text-[#2d4a3e]" />,
              title: 'Seguimiento Continuo',
              description: 'Acompañamiento sostenido para construir bienestar a largo plazo.'
            }
          ].map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 text-center shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-white/40"
            >
              <div className="flex justify-center mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-[#2d4a3e]">{service.title}</h3>
              <p className="text-[#4a6b5a] mt-2">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* DONACIONES */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-[#2d4a3e] rounded-3xl p-8 md:p-12 text-center text-white">
          <FaDonate className="text-5xl mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-serif">Apoya nuestro proyecto</h2>
          <p className="text-white/80 mt-4 max-w-xl mx-auto">
            Cada donación nos permite seguir acompañando a más personas que necesitan un espacio de escucha.
          </p>
          <Link
            to="/donaciones"
            className="inline-block mt-6 bg-white text-[#2d4a3e] px-10 py-4 rounded-full text-lg font-medium hover:bg-white/90 transition-all hover:scale-105"
          >
            Donar Ahora
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* ENTREVISTAS / TESTIMONIOS */}
      {/* ============================================ */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-[#2d4a3e] mb-12">
          Voces que inspiran
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              name: 'María Elena',
              quote: 'Encontré un espacio donde pude hablar sin miedo. Me sentí escuchada por primera vez.'
            },
            {
              name: 'Carlos Andrés',
              quote: 'La guía que recibí me ayudó a ver mis problemas desde otra perspectiva. Estoy muy agradecido.'
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/40"
            >
              <FaMicrophone className="text-[#2d4a3e]/30 text-3xl mb-4" />
              <p className="text-[#2d4a3e] text-lg italic">"{testimonial.quote}"</p>
              <p className="text-[#4a6b5a] font-medium mt-4">— {testimonial.name}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/testimonios"
            className="inline-flex items-center gap-2 text-[#2d4a3e] hover:text-[#4a7c5e] transition-colors font-medium"
          >
            Ver más historias <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="border-t border-[#2d4a3e]/10 py-8 mt-8">
        <div className="container mx-auto px-6 text-center text-[#4a6b5a] text-sm">
          <p>© 2026 Fundación Apoyo. Un espacio para sanar.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;