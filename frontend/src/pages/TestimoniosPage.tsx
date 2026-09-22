import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

// ============================================
// TESTIMONIOS (editable - agrega más aquí)
// ============================================
interface Testimonio {
  id: number;
  nombre: string;
  edad?: number;
  ciudad?: string;
  avatar: string;
  categoria: 'apoyo' | 'crisis' | 'seguimiento';
  titulo: string;
  historia: string;
  destacado?: boolean;
}

const TESTIMONIOS: Testimonio[] = [
  {
    id: 1,
    nombre: 'María Elena',
    edad: 34,
    ciudad: 'Bogotá',
    avatar: '🌸',
    categoria: 'apoyo',
    titulo: 'Encontré un lugar donde no me sentí juzgada',
    historia: 'Después de meses sintiéndome sola y sin saber a quién acudir, decidí agendar una sesión. Encontré un espacio donde pude hablar sin miedo, sin sentirme juzgada. Me sentí escuchada por primera vez en mucho tiempo. Hoy puedo decir que estoy aprendiendo a sanar a mi ritmo.',
    destacado: true
  },
  {
    id: 2,
    nombre: 'Carlos Andrés',
    edad: 28,
    ciudad: 'Medellín',
    avatar: '🌱',
    categoria: 'seguimiento',
    titulo: 'La guía que me ayudó a ver con otros ojos',
    historia: 'Estaba pasando por un momento muy difícil en mi trabajo y en mi familia. La guía que recibí me ayudó a ver mis problemas desde otra perspectiva. No me dieron soluciones mágicas, pero me acompañaron a encontrarlas yo mismo. Hoy tengo esperanza.',
    destacado: true
  },
  {
    id: 3,
    nombre: 'Anónima',
    edad: 45,
    avatar: '🕊️',
    categoria: 'crisis',
    titulo: 'En mi momento más oscuro, alguien me escuchó',
    historia: 'Llamé en un momento de crisis. No sabía ni por dónde empezar. Pero la persona que me atendió me dio un espacio seguro, sin apuros, sin juicios. Solo me dejó hablar. Esa conversación me recordó que aún hay razones para seguir. Gracias por estar ahí.'
  },
  {
    id: 4,
    nombre: 'Laura Sofía',
    edad: 22,
    ciudad: 'Cali',
    avatar: '💛',
    categoria: 'apoyo',
    titulo: 'Aprendí que pedir ayuda no es debilidad',
    historia: 'Siempre pensé que debía poder con todo yo sola. Cuando finalmente decidí pedir ayuda, me di cuenta de que era el acto más valiente que podía hacer. Aquí encontré personas que me acompañaron sin hacerme sentir menos. Estoy muy agradecida.'
  },
  {
    id: 5,
    nombre: 'Diego',
    edad: 52,
    ciudad: 'Barranquilla',
    avatar: '🌿',
    categoria: 'seguimiento',
    titulo: 'Un acompañamiento que me cambió la vida',
    historia: 'Después de perder a mi esposa, no sabía cómo seguir. El acompañamiento que recibí, sesión tras sesión, me ayudó a reconstruirme. No fue rápido, pero cada conversación me daba un poco más de fuerza. Hoy puedo recordarla con amor, sin tanto dolor.'
  },
  {
    id: 6,
    nombre: 'Anónima',
    edad: 19,
    avatar: '✨',
    categoria: 'crisis',
    titulo: 'Escuchar historias me ayudó a sentirme menos sola',
    historia: 'Leer los testimonios de otras personas me hizo entender que no estaba sola en lo que sentía. Ver que otros habían pasado por lo mismo y habían salido adelante me dio esperanza. Por eso quiero compartir mi historia también, por si alguien la necesita.'
  }
];

// ============================================
// PÁGINA
// ============================================
const TestimoniosPage: React.FC = () => {
  const [filtro, setFiltro] = useState<'todos' | 'apoyo' | 'crisis' | 'seguimiento'>('todos');

  const testimoniosFiltrados = filtro === 'todos'
    ? TESTIMONIOS
    : TESTIMONIOS.filter(t => t.categoria === filtro);

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case 'apoyo': return '🌱 Apoyo';
      case 'crisis': return '🆘 Crisis';
      case 'seguimiento': return '📋 Seguimiento';
      default: return cat;
    }
  };

  const getCategoriaColor = (cat: string) => {
    switch (cat) {
      case 'apoyo': return 'bg-[#81B29A]/20 text-[#3D405B]';
      case 'crisis': return 'bg-[#E07A5F]/20 text-[#3D405B]';
      case 'seguimiento': return 'bg-[#F2CC8F]/40 text-[#3D405B]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] via-[#F4E8D8] to-[#FAF0E0]">
      {/* Navegación */}
      <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
        <Link to="/" className="text-2xl font-serif font-bold text-[#3D405B]">
          Fundación Apoyo
        </Link>
        <Link
          to="/"
          className="text-sm text-[#3D405B] hover:text-[#E07A5F] transition-colors flex items-center gap-2"
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
          💬
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4"
        >
          Voces que inspiran
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-[#5D6078] leading-relaxed"
        >
          Historias reales de personas que dieron el primer paso y encontraron un espacio seguro para sanar. Si ellos pudieron, tú también.
        </motion.p>
      </section>

      {/* Filtros */}
      <section className="container mx-auto px-6 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { key: 'todos', label: '✨ Todos' },
            { key: 'apoyo', label: '🌱 Apoyo' },
            { key: 'crisis', label: '🆘 Crisis' },
            { key: 'seguimiento', label: '📋 Seguimiento' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFiltro(item.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtro === item.key
                  ? 'bg-[#E07A5F] text-white shadow-md scale-105'
                  : 'bg-white/70 text-[#3D405B] hover:bg-white border border-[#F2CC8F]/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Testimonios */}
      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimoniosFiltrados.map((testimonio, index) => (
            <motion.div
              key={testimonio.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border ${
                testimonio.destacado 
                  ? 'border-[#E07A5F]/40' 
                  : 'border-[#F2CC8F]/40'
              }`}
            >
              {/* Encabezado */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F2CC8F] to-[#E07A5F]/40 flex items-center justify-center text-3xl flex-shrink-0">
                  {testimonio.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#3D405B]">{testimonio.nombre}</p>
                    {testimonio.edad && (
                      <span className="text-xs text-[#5D6078]">• {testimonio.edad} años</span>
                    )}
                  </div>
                  {testimonio.ciudad && (
                    <p className="text-xs text-[#5D6078]">📍 {testimonio.ciudad}</p>
                  )}
                </div>
                {testimonio.destacado && (
                  <span className="text-xl" title="Historia destacada">⭐</span>
                )}
              </div>

              {/* Categoría */}
              <div className="mb-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoriaColor(testimonio.categoria)}`}>
                  {getCategoriaLabel(testimonio.categoria)}
                </span>
              </div>

              {/* Título */}
              <h3 className="text-lg md:text-xl font-serif text-[#3D405B] mb-3">
                "{testimonio.titulo}"
              </h3>

              {/* Historia */}
              <p className="text-[#5D6078] leading-relaxed text-sm md:text-base">
                {testimonio.historia}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="container mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-3xl p-8 md:p-12 text-center border border-[#F2CC8F]/50 max-w-3xl mx-auto"
        >
          <div className="text-5xl mb-4">🌅</div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#3D405B] mb-4">
            Tu historia también merece ser contada
          </h2>
          <p className="text-[#5D6078] mb-8 max-w-xl mx-auto">
            El primer paso es el más difícil, pero no tienes que darlo solo. Estamos aquí para acompañarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="bg-[#E07A5F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d16a4f] transition-all hover:scale-105 shadow-lg shadow-[#E07A5F]/30"
            >
              🌱 Comenzar ahora
            </Link>
            <Link
              to="/"
              className="border-2 border-[#81B29A] text-[#81B29A] px-8 py-4 rounded-full font-medium hover:bg-[#81B29A]/10 transition-all"
            >
              ← Volver al inicio
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
      <WhatsAppButton />
      
    </div>
  );
};

export default TestimoniosPage;