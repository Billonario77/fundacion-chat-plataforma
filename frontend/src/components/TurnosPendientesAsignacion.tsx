import React, { useEffect, useState } from 'react';
import { adminService, TurnoPendiente, GuiaDisponible } from '../services/adminService';
import toast from 'react-hot-toast';

interface TurnosPendientesAsignacionProps {
  onAsignar?: () => void;
}

const TurnosPendientesAsignacion: React.FC<TurnosPendientesAsignacionProps> = ({ onAsignar }) => {
  const [turnos, setTurnos] = useState<TurnoPendiente[]>([]);
  const [guias, setGuias] = useState<GuiaDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTurnosPendientes();
    cargarGuias();
  }, []);

  const cargarTurnosPendientes = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTurnosPendientesAsignacion();
      setTurnos(data);
    } catch (err) {
      setError('Error al cargar turnos pendientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarGuias = async () => {
    try {
      const data = await adminService.getGuiasDisponibles();
      setGuias(data);
    } catch (err) {
      console.error('Error al cargar guías:', err);
    }
  };

  const handleAsignarGuia = async (turnoId: string, guiaId: string) => {
    try {
      setAsignando(turnoId);
      await adminService.asignarGuiaATurno(turnoId, guiaId);
      
      toast.success('Guía asignado correctamente');
      cargarTurnosPendientes();
      if (onAsignar) onAsignar();
      
    } catch (err) {
      toast.error('Error al asignar guía');
      console.error(err);
    } finally {
      setAsignando(null);
    }
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-primario mb-6">
          👥 Nuevos Usuarios (Pendientes de Asignación)
        </h2>
        <p className="text-gray-500">Cargando turnos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-primario mb-6">
        👥 Nuevos Usuarios (Pendientes de Asignación)
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {turnos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay nuevos usuarios esperando asignación de guía
        </div>
      ) : (
        <div className="space-y-4">
          {turnos.map((turno) => (
            <div
              key={turno.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Pendiente de asignación
                    </span>
                    <span className="text-sm text-gray-500">
                      Solicitado: {formatFecha(turno.created_at)}
                    </span>
                  </div>
                  
                  <p className="font-medium text-gray-800">
                    Usuario: {turno.usuario_nombre}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Email: {turno.usuario_email}
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Tipo:</span>{' '}
                      {turno.tipo === 'crisis' && '🆘 Crisis'}
                      {turno.tipo === 'apoyo' && '🌱 Apoyo general'}
                      {turno.tipo === 'seguimiento' && '📋 Seguimiento'}
                    </p>
                    {turno.mensaje_inicial && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Mensaje:</span> {turno.mensaje_inicial}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAsignarGuia(turno.id, e.target.value);
                      }
                    }}
                    value=""
                    disabled={asignando === turno.id}
                  >
                    <option value="">Seleccionar guía</option>
                    {guias.map((guia) => (
                      <option key={guia.id} value={guia.id}>
                        {guia.nombre}
                      </option>
                    ))}
                  </select>
                  
                  {asignando === turno.id && (
                    <p className="text-xs text-primario text-center">Asignando...</p>
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

export default TurnosPendientesAsignacion;