// frontend/src/components/admin/GestionTestimonios.tsx
import React, { useEffect, useState } from 'react';
import StarRating from '../StarRating';
import {
  testimoniosService,
  TestimonioAdmin,
} from '../../services/testimoniosService';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobado', label: 'Aprobados' },
  { key: 'rechazado', label: 'Rechazados' },
  { key: '', label: 'Todos' },
] as const;

export default function GestionTestimonios() {
  const [tab, setTab] = useState<string>('pendiente');
  const [items, setItems] = useState<TestimonioAdmin[]>([]);
  const [cargando, setCargando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [rechazando, setRechazando] = useState<TestimonioAdmin | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await testimoniosService.adminListar({
        estado: tab || undefined,
        limit: 50,
      });
      setItems(data.testimonios);
    } catch (err) {
      console.error('Error al cargar testimonios:', err);
      toast.error('Error al cargar testimonios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const aprobar = async (id: number) => {
    try {
      await testimoniosService.adminAprobar(id);
      toast.success('Testimonio aprobado');
      cargar();
    } catch (err) {
      console.error(err);
      toast.error('Error al aprobar');
    }
  };

  const destacar = async (id: number) => {
    try {
      await testimoniosService.adminDestacar(id);
      toast.success('Estado de destaque actualizado');
      cargar();
    } catch (err) {
      console.error(err);
      toast.error('Error al destacar');
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar definitivamente este testimonio?')) return;
    try {
      await testimoniosService.adminEliminar(id);
      toast.success('Testimonio eliminado');
      cargar();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const confirmarRechazo = async () => {
    if (!rechazando || motivo.trim().length < 5) return;
    try {
      await testimoniosService.adminRechazar(rechazando.id, motivo.trim());
      toast.success('Testimonio rechazado');
      setRechazando(null);
      setMotivo('');
      cargar();
    } catch (err) {
      console.error(err);
      toast.error('Error al rechazar');
    }
  };

  const badge = (estado: string, destacado: boolean) => {
    const map: Record<string, string> = {
      pendiente: 'bg-[#F2CC8F]/40 text-[#3D405B]',
      aprobado: 'bg-[#81B29A]/30 text-[#3D405B]',
      rechazado: 'bg-red-100 text-red-700',
    };
    return `text-xs px-3 py-1 rounded-full font-medium ${map[estado] || ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primario mb-1">
          Moderación de testimonios
        </h2>
        <p className="text-sm text-gray-500">
          Aprueba, rechaza o destaca las voces de la comunidad.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100/80 p-2 rounded-2xl">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              tab === t.key
                ? 'bg-white text-primario shadow-md'
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <p className="text-gray-500 py-6 text-center">Cargando testimonios…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 italic py-6 text-center">
          No hay testimonios en esta vista.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((t) => (
            <li
              key={t.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>
                      {t.es_anonimo ? t.nickname ?? 'Anónimo' : t.nombre}
                    </strong>
                    <span className="ml-2 text-gray-400">({t.email})</span>
                  </p>
                  <div className="mt-1">
                    <StarRating value={t.calificacion} readOnly size="sm" />
                  </div>
                </div>
                <span className={badge(t.estado, t.destacado)}>
                  {t.estado}
                  {t.destacado && ' · ⭐ destacado'}
                </span>
              </div>

              <p className="mt-3 text-gray-700 whitespace-pre-line">
                {t.contenido}
              </p>

              {t.motivo_rechazo && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  Motivo previo: {t.motivo_rechazo}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {t.estado !== 'aprobado' && (
                  <button
                    onClick={() => aprobar(t.id)}
                    className="bg-primario text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primario-dark transition-colors"
                  >
                    Aprobar
                  </button>
                )}
                {t.estado !== 'rechazado' && (
                  <button
                    onClick={() => setRechazando(t)}
                    className="bg-[#F2CC8F] text-[#3D405B] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e6bf7f] transition-colors"
                  >
                    Rechazar
                  </button>
                )}
                {t.estado === 'aprobado' && (
                  <button
                    onClick={() => destacar(t.id)}
                    className="border border-[#E07A5F] text-[#E07A5F] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E07A5F]/10 transition-colors"
                  >
                    {t.destacado ? 'Quitar destaque' : 'Destacar'}
                  </button>
                )}
                <button
                  onClick={() => eliminar(t.id)}
                  className="text-gray-500 hover:text-red-600 px-4 py-2 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal rechazo */}
      {rechazando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Motivo del rechazo
            </h3>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="Explica brevemente por qué no se publicará…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRechazando(null);
                  setMotivo('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRechazo}
                disabled={motivo.trim().length < 5}
                className="px-4 py-2 text-sm font-medium text-white bg-primario hover:bg-primario-dark rounded-lg disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}