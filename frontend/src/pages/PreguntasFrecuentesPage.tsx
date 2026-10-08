import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';

interface Pregunta {
  q: string;
  a: string;
}

interface Categoria {
  emoji: string;
  titulo: string;
  preguntas: Pregunta[];
}

const CATEGORIAS: Categoria[] = [
  {
    emoji: '🌱',
    titulo: 'Sobre las sesiones',
    preguntas: [
      {
        q: '¿Qué tipo de acompañamiento ofrecen?',
        a: 'Ofrecemos espacios de escucha activa y acompañamiento emocional a través de sesiones de chat y videollamada con guías capacitados. No es terapia psicológica ni atención médica; es un espacio seguro para hablar y ser escuchado.'
      },
      {
        q: '¿Cuánto dura una sesión?',
        a: 'Las sesiones estándar duran 60 minutos. En algunos casos puedes solicitar extensión si tu guía tiene disponibilidad.'
      },
      {
        q: '¿Cómo agendo una sesión?',
        a: 'Regístrate, completa tus datos básicos, y en tu panel de usuario haz click en "Solicitar apoyo". Elige el tipo de acompañamiento (apoyo general, crisis o seguimiento), cuéntanos brevemente qué necesitas y, si quieres, selecciona una fecha y hora preferida. Un administrador o el sistema te asignará un guía.'
      },
      {
        q: '¿Puedo elegir a mi guía?',
        a: 'En tu primera sesión se te asigna un guía según disponibilidad. En solicitudes posteriores se te asignará el mismo guía automáticamente para dar continuidad a tu proceso. Si quieres cambiar de guía, puedes solicitarlo al agendar ("Quiero otro guía") o pedir volver a tu guía original desde tu panel.'
      },
      {
        q: '¿Qué pasa si estoy en crisis?',
        a: 'Si estás en una emergencia con riesgo para tu vida o la de otras personas, por favor acude de inmediato a los servicios de emergencia (línea 123 en Colombia) o a un centro hospitalario. Nuestro servicio complementa, pero no reemplaza, la atención de urgencias.'
      }
    ]
  },
  {
    emoji: '💳',
    titulo: 'Pagos',
    preguntas: [
      {
        q: '¿Cuánto cuesta una sesión?',
        a: 'El valor de cada sesión se muestra antes de confirmar el pago. Si perteneces a un convenio con una empresa, institución o entidad estatal, puedes tener un descuento o acceso a una bolsa de horas contratada. En ese caso, el sistema lo aplica automáticamente o al ingresar tu cupón.'
      },
      {
        q: '¿Cómo puedo pagar?',
        a: 'Los pagos se procesan a través de Wompi, una pasarela autorizada en Colombia. Puedes pagar con tarjeta débito o crédito, PSE y otros métodos disponibles en Wompi.'
      },
      {
        q: '¿Es seguro pagar en la Plataforma?',
        a: 'Sí. Nosotros no almacenamos datos de tarjetas. La transacción se procesa directamente en Wompi, que cumple con los estándares de seguridad de la industria financiera.'
      },
      {
        q: '¿Puedo usar un cupón de descuento?',
        a: 'Sí. Si tienes un cupón de convenio, ingrésalo al momento de pagar tu sesión y el sistema calculará el nuevo valor. Cada cupón es de un solo uso por persona.'
      }
    ]
  },
  {
    emoji: '✗',
    titulo: 'Cancelaciones y multas',
    preguntas: [
      {
        q: '¿Puedo cancelar una sesión?',
        a: 'Sí. Puedes cancelar sin costo hasta 2 horas antes del inicio de tu sesión. Si cancelas con menos de 2 horas de anticipación, se aplica una multa del 50% del valor de la sesión.'
      },
      {
        q: '¿Qué pasa si no pago la sesión a tiempo?',
        a: 'Si no realizas el pago 1 hora antes del inicio (o 5 minutos después del inicio, si agendaste con menos de 70 minutos de anticipación), la sesión se cancela automáticamente y se genera una multa del 50% del valor de la sesión, que se suma a tu próxima sesión.'
      },
      {
        q: '¿Puedo agendar si tengo una multa pendiente?',
        a: 'Si no tienes sesiones activas, sí puedes agendar una (que incluirá la multa). Si ya tienes una sesión activa, debes pagar primero esa sesión (con la multa incluida) antes de agendar otra.'
      },
      {
        q: '¿Qué pasa si cancelo la sesión que incluía la multa?',
        a: 'La multa se libera y se sumará automáticamente a tu próxima sesión.'
      }
    ]
  },
  {
    emoji: '🔒',
    titulo: 'Anonimato y privacidad',
    preguntas: [
      {
        q: '¿Puedo usar la Plataforma de forma anónima?',
        a: 'Sí. Al registrarte puedes elegir el modo anónimo: solo se te pedirá un NickName y tu identidad real no será visible para otros usuarios ni para los guías.'
      },
      {
        q: 'Si soy anónimo, ¿puedo acceder a convenios?',
        a: 'No. Los convenios (descuentos o bolsas de horas de empresas, colegios, universidades) requieren que te registres con tu correo corporativo o institucional. El registro anónimo funciona con tu correo personal y no aplica a beneficios de convenio.'
      },
      {
        q: '¿Qué hacen con mis datos?',
        a: 'Tratamos tus datos de acuerdo con la Ley 1581 de 2012. Puedes leer todos los detalles en nuestra Política de Privacidad.'
      },
      {
        q: '¿Las conversaciones se graban?',
        a: 'Los mensajes de chat se almacenan para garantizar la continuidad del servicio, atender reclamaciones y cumplir obligaciones legales. Las sesiones de videollamada pueden ser grabadas solo con tu consentimiento expreso.'
      }
    ]
  },
  {
    emoji: '🏢',
    titulo: 'Convenios',
    preguntas: [
      {
        q: '¿Qué es un convenio?',
        a: 'Un acuerdo entre Voces del Alma y una empresa, colegio, universidad u otra entidad, que ofrece beneficios a sus empleados, estudiantes o miembros. Hay dos modalidades: descuento (recibes un cupón con un % de descuento por sesión) o bolsa de horas (la entidad contrata un paquete de horas que sus usuarios consumen al agendar).'
      },
      {
        q: '¿Cómo accedo a los beneficios de un convenio?',
        a: 'Depende de tu caso: si tu institución ya cargó tu correo en la Plataforma, se te vincula automáticamente al registrarte con ese correo. Si tienes un cupón de descuento, ingrésalo al momento de pagar tu sesión. Si tienes un código de bolsa, ingrésalo en tu panel en la pestaña "Mi convenio" (solo una vez).'
      },
      {
        q: '¿Qué pasa si se agotan las horas de la bolsa?',
        a: 'Podrás seguir agendando sesiones, pero pagando tarifa plena con tus propios medios. Tu institución puede recargar la bolsa cuando lo considere.'
      }
    ]
  },
  {
    emoji: '👥',
    titulo: 'Guías',
    preguntas: [
      {
        q: '¿Quiénes son los guías?',
        a: 'Son personas capacitadas para ofrecer escucha activa y acompañamiento emocional. No son psicólogos ni psiquiatras y no emiten diagnósticos clínicos. Si necesitas atención clínica, te recomendamos acudir a un profesional de la salud mental.'
      },
      {
        q: '¿Cómo se asigna un guía?',
        a: 'En tu primera solicitud, se te asigna un guía según disponibilidad y tipo de acompañamiento. Después de eso, el mismo guía te acompaña para dar continuidad, salvo que pidas un cambio.'
      }
    ]
  },
  {
    emoji: '💛',
    titulo: 'Donaciones',
    preguntas: [
      {
        q: '¿Cómo puedo donar?',
        a: 'Desde la página Donar puedes hacer una donación única con tarjeta, PSE u otros medios a través de Wompi.'
      },
      {
        q: '¿Puedo donar de forma anónima?',
        a: 'Sí. Al donar puedes marcar la opción "donación anónima" y no aparecerás en los registros públicos.'
      },
      {
        q: '¿Las donaciones son deducibles de impuestos?',
        a: 'Para información sobre deducciones, escríbenos a contacto@vocesdelalma.com.'
      }
    ]
  },
  {
    emoji: '📋',
    titulo: 'Cuenta y registro',
    preguntas: [
      {
        q: '¿Necesito completar mis datos?',
        a: 'Sí. Después de registrarte te pediremos algunos datos básicos para tu seguridad y para brindar un mejor acompañamiento. Los datos sensibles son voluntarios.'
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        a: 'Escríbenos a contacto@vocesdelalma.com y procesaremos tu solicitud según la Ley 1581 de 2012.'
      },
      {
        q: '¿Olvidé mi contraseña, qué hago?',
        a: 'En la pantalla de login hay un enlace "¿Olvidaste tu contraseña?" donde puedes restablecerla con tu correo.'
      }
    ]
  }
];

const PreguntasFrecuentesPage: React.FC = () => {
  const [abierta, setAbierta] = useState<string | null>(null);

  const toggle = (key: string) => {
    setAbierta((prev) => (prev === key ? null : key));
  };

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
          ❓
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif text-[#3D405B] mb-4"
        >
          Preguntas Frecuentes
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-[#5D6078] leading-relaxed"
        >
          Encuentra respuestas rápidas sobre nuestras sesiones, pagos, convenios y más.
          Si no encuentras lo que buscas, escríbenos a contacto@vocesdelalma.com.
        </motion.p>
      </section>

      {/* Categorías y preguntas */}
      <section className="container mx-auto px-6 pb-16 max-w-3xl">
        {CATEGORIAS.map((cat, idx) => (
          <motion.div
            key={cat.titulo}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl md:text-2xl font-serif text-[#3D405B] mb-4 flex items-center gap-2">
              <span className="text-2xl">{cat.emoji}</span>
              {cat.titulo}
            </h2>

            <div className="space-y-3">
              {cat.preguntas.map((p, qIdx) => {
                const key = `${idx}-${qIdx}`;
                const isOpen = abierta === key;
                return (
                  <div
                    key={key}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#F2CC8F]/40 overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-[#FDF6EC]/50 transition-colors"
                    >
                      <span className="font-medium text-[#3D405B] flex-1">
                        {p.q}
                      </span>
                      <span
                        className={`text-[#E07A5F] text-xl leading-none flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      >
                        +
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 text-[#5D6078] leading-relaxed border-t border-[#F2CC8F]/30">
                            <p className="pt-4">{p.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-3xl p-8 text-center border border-[#F2CC8F]/50 mt-12"
        >
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-xl md:text-2xl font-serif text-[#3D405B] mb-3">
            ¿Aún tienes dudas?
          </h3>
          <p className="text-[#5D6078] mb-6 max-w-lg mx-auto">
            Escríbenos y te responderemos lo antes posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:contacto@vocesdelalma.com"
              className="w-full sm:w-auto bg-[#E07A5F] text-white px-6 py-3 rounded-full text-sm sm:text-base font-medium hover:bg-[#d16a4f] transition-all hover:scale-105 text-center whitespace-nowrap"
            >
              📧 Escríbenos
            </a>
            <a
              href="https://wa.me/573027287033"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border-2 border-[#81B29A] text-[#81B29A] px-6 py-3 rounded-full text-sm sm:text-base font-medium hover:bg-[#81B29A]/10 transition-all text-center whitespace-nowrap"
            >
              💬 WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default PreguntasFrecuentesPage;