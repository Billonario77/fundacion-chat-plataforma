import StarRating from './StarRating';
import type { Testimonio } from '../services/testimoniosService';

interface Props {
  testimonios: Testimonio[];
  onEditar: (t: Testimonio) => void;
  onEliminar: (id: number) => void;
}

const badge = (estado: Testimonio['estado']) => {
  const map: Record<Testimonio['estado'], string> = {
    pendiente: 'bg-[#F2CC8F]/30 text-[#3D405B]',
    aprobado: 'bg-[#81B29A]/25 text-[#3D405B]',
    rechazado: 'bg-red-100 text-red-700',
  };
  return `text-xs px-3 py-1 rounded-full font-medium ${map[estado]}`;
};

export default function MisTestimonios({ testimonios, onEditar, onEliminar }: Props) {
  if (!testimonios.length) {
    return (
      <p className="text-[#3D405B]/60 italic">
        Aún no has enviado testimonios. ¡Tu voz es importante para nosotros!
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {testimonios.map((t) => (
        <li
          key={t.id}
          className="rounded-3xl bg-white/70 backdrop-blur-sm border border-[#3D405B]/10 p-5"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <StarRating value={t.calificacion} readOnly size="sm" />
            <span className={badge(t.estado)}>
              {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
            </span>
          </div>

          <h4 className="font-serif text-lg text-[#3D405B] mb-1">
            "{t.titulo}"
          </h4>

          {(t.edad || t.ciudad) && (
            <p className="text-xs text-[#3D405B]/60 mb-3">
              {t.edad && <span>{t.edad} años</span>}
              {t.edad && t.ciudad && <span> • </span>}
              {t.ciudad && <span>📍 {t.ciudad}</span>}
            </p>
          )}

          <p className="text-[#3D405B] whitespace-pre-line">{t.contenido}</p>

          {t.estado === 'rechazado' && t.motivo_rechazo && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              Motivo del rechazo: {t.motivo_rechazo}
            </p>
          )}

          <div className="mt-4 flex gap-3 text-sm">
            {t.estado !== 'aprobado' && (
              <button
                type="button"
                onClick={() => onEditar(t)}
                className="text-[#E07A5F] hover:underline font-medium"
              >
                Editar y reenviar
              </button>
            )}
            <button
              type="button"
              onClick={() => onEliminar(t.id)}
              className="text-[#3D405B]/60 hover:text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}