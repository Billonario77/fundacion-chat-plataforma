import React, { useEffect, useState } from 'react';
import { adminService, SolicitudReprogramacion } from '../services/adminService';

interface SolicitudesReprogramacionProps {
  onAsignar: (solicitudId: string, guiaId: string) => void;
}

const SolicitudesReprogramacion: React.FC<SolicitudesReprogramacionProps> = ({ onAsignar }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudReprogramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guias, setGuias] = useState<{ id: string; nombre: string }[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<string | null>(null);
  const [guiaSeleccionado, setGuiaSeleccionado] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const data = await adminService.getSolicitudesReprogramacion();
      setSolicitudes(data);
    } catch (err) {
      setError('Error al cargar solicitudes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarGuias = async (solicitudId?: string, fechaPreferida?: string) => {
    try {
      console.log('🔍 Cargando guías disponibles...');
      const data = await adminService.getGuiasDisponibles(fechaPreferida || undefined, solicitudId);
      console.log('✅ Guías recibidas:', data);
      setGuias(data);
      
      if (data.length === 0) {
        console.warn('⚠️ No se encontraron guías disponibles para este horario');
      }
    } catch (err) {
      console.error('❌ Error al cargar guías:', err);
    }
  };

  const handleAsignar = (solicitudId: string) => {
    if (guiaSeleccionado) {
      onAsignar(solicitudId, guiaSeleccionado);
      setSolicitudSeleccionada(null);
      setGuiaSeleccionado('');
    }
  };

  const handleSeleccionarSolicitud = (solicitud: SolicitudReprogramacion) => {
    setSolicitudSeleccionada(solicitud.id);
    setGuiaSeleccionado('');
    cargarGuias(solicitud.id, solicitud.fecha_preferida || undefined);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Solicitudes de Reprogramación</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {solicitudes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay solicitudes de reprogramación pendientes
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Pendiente
                    </span>
                    <span className="text-sm text-gray-500">
                      Solicitado: {formatFecha(solicitud.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700">
                    <span className="font-medium">Usuario:</span> {solicitud.usuario_nombre}
                  </p>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Email:</span> {solicitud.usuario_email}
                  </p>

                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Preferencia:</p>
                    <p className="text-sm text-gray-600">
                      {solicitud.preferencia === 'mismo_guia' && '🔁 Quiere el mismo guía'}
                      {solicitud.preferencia === 'otro_guia' && '👥 Quiere un guía diferente'}
                      {solicitud.preferencia === 'cambiar_fecha' && '📅 Quiere cambiar la fecha'}
                    </p>
                    
                    {solicitud.fecha_preferida && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Fecha preferida:</span>{' '}
                        {formatFecha(solicitud.fecha_preferida)}
                      </p>
                    )}
                    
                    {solicitud.comentarios && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Comentarios:</span>{' '}
                        {solicitud.comentarios}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                  {solicitudSeleccionada === solicitud.id ? (
                    <>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={guiaSeleccionado}
                        onChange={(e) => setGuiaSeleccionado(e.target.value)}
                      >
                        <option value="">Seleccionar guía</option>
                        {guias.map((guia) => (
                          <option key={guia.id} value={guia.id}>
                            {guia.nombre}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAsignar(solicitud.id)}
                          disabled={!guiaSeleccionado}
                          className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(null);
                            setGuiaSeleccionado('');
                          }}
                          className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSeleccionarSolicitud(solicitud)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Asignar guía
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolicitudesReprogramacion;
