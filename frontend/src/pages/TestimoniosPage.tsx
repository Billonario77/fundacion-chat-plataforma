import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { testimoniosService, TestimonioPublico } from '../services/testimoniosService';

const POR_PAGINA = 9;

// ============================================
// PÁGINA
// ============================================
const TestimoniosPage: React.FC = () => {
  const [testimonios, setTestimonios] = useState<TestimonioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    (async () => {
      try {
        const data = await testimoniosService.listarPublicos({
          page: pagina,
          limit: POR_PAGINA,
        });
        if (!activo) return;
        setTestimonios(data.testimonios);
        setTotalPaginas(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        console.error('Error al cargar testimonios:', err);
        if (activo) {
          setTestimonios([]);
          setTotalPaginas(0);
          setTotal(0);
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [pagina]);

  // Al cambiar de página, subir al inicio de la sección
  useEffect(() => {
    if (pagina > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagina]);

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        timeZone: 'America/Bogota',
      });
    } catch {
      return '';
    }
  };

  const EMOJIS = ['🕊️', '🌙', '☀️', '✨', '🍃', '💫', '🕯️', '🌟'];
  const getAvatar = (t: TestimonioPublico) =>
    t.es_anonimo ? '🍀' : EMOJIS[t.id % EMOJIS.length];

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
          Historias reales de personas que dieron el primer paso y encontraron un
          espacio seguro para sanar. Si ellos pudieron, tú también.
        </motion.p>
      </section>

      {/* Testimonios */}
      <section className="container mx-auto px-6 pb-16">
        {cargando ? (
          <p className="text-center text-[#5D6078] italic py-12">
            Cargando testimonios…
          </p>
        ) : testimonios.length === 0 ? (
          <div className="text-center py-16 max-w-xl mx-auto">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-[#5D6078] italic mb-2">
              Aún no hay testimonios publicados.
            </p>
            <p className="text-sm text-[#5D6078]/70">
              Sé la primera persona en compartir tu historia.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonios.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                  viewport={{ once: true }}
                  className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border ${
                    t.destacado ? 'border-[#E07A5F]/40' : 'border-[#F2CC8F]/40'
                  }`}
                >
                  {/* Encabezado */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F2CC8F] to-[#E07A5F]/40 flex items-center justify-center text-2xl flex-shrink-0">
                      {getAvatar(t)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#3D405B] truncate">
                        {t.autor}
                      </p>
                      <p className="text-xs text-[#5D6078]">
                        {t.edad && <span>{t.edad} años</span>}
                        {t.edad && t.ciudad && <span> • </span>}
                        {t.ciudad && <span>📍 {t.ciudad}</span>}
                        {!t.edad && !t.ciudad && <span>{formatFecha(t.creado_en)}</span>}
                      </p>
                    </div>
                    {t.destacado && (
                      <span className="text-xl flex-shrink-0" title="Destacado">
                        ⭐
                      </span>
                    )}
                  </div>

                  {/* Estrellas */}
                  <div className="flex gap-0.5 text-lg mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          n <= t.calificacion
                            ? 'text-[#F2CC8F]'
                            : 'text-[#3D405B]/15'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-serif text-[#3D405B] mb-3">
                    "{t.titulo}"
                  </h3>

                  {/* Contenido */}
                  <p className="text-[#5D6078] leading-relaxed text-sm whitespace-pre-line">
                    {t.contenido}
                  </p>

                  {/* Fecha al pie */}
                  <p className="text-xs text-[#5D6078]/60 mt-4">
                    {formatFecha(t.creado_en)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white/80 border border-[#F2CC8F]/40 text-[#3D405B] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Anterior
                </button>

                <span className="text-sm text-[#3D405B]">
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                  <span className="text-[#5D6078]/70"> · {total} testimonios</span>
                </span>

                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white/80 border border-[#F2CC8F]/40 text-[#3D405B] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
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
            El primer paso es el más difícil, pero no tienes que darlo solo. Estamos
            aquí para acompañarte.
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