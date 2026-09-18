import React, { useEffect, useState } from 'react';
import { donacionesService } from '../../services/donacionesService';
import toast from 'react-hot-toast';

interface Donacion {
  id: string;
  referencia_wompi: string;
  nombre_donante?: string;
  email_donante?: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completada' | 'fallida' | 'cancelada' | 'error';
  metodo_pago?: string;
  mensaje?: string;
  es_anonima: boolean;
  created_at: string;
}

interface Estadisticas {
  total_donaciones: string;
  completadas: string;
  pendientes: string;
  fallidas: string;
  total_recaudado: string;
  promedio_donacion: string;
  por_mes: Array<{
    mes: string;
    cantidad: string;
    total: string;
  }>;
}

const GestionDonaciones: React.FC = () => {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [pestanaActiva, setPestanaActiva] = useState<'estadisticas' | 'historial'>('estadisticas');

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas
      const statsResponse = await donacionesService.obtenerEstadisticasDonaciones();
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }

      // Cargar donaciones con filtro
      const filtros = filtroEstado ? { estado: filtroEstado } : undefined;
      const donacionesResponse = await donacionesService.obtenerDonaciones(filtros);
      if (donacionesResponse.success) {
        setDonaciones(donacionesResponse.data);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar donaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Number(value));
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'fallida': return 'bg-red-100 text-red-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !estadisticas) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primario mb-6">Donaciones</h2>

      {/* Pestañas */}
      <div className="flex gap-2 mb-6 bg-gray-100/80 p-2 rounded-2xl">
        <button
          onClick={() => setPestanaActiva('estadisticas')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            pestanaActiva === 'estadisticas'
              ? 'bg-white text-primario shadow-md'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          📊 Estadísticas
        </button>
        <button
          onClick={() => setPestanaActiva('historial')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            pestanaActiva === 'historial'
              ? 'bg-white text-primario shadow-md'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          📋 Historial
        </button>
      </div>

      {/* CONTENIDO: ESTADÍSTICAS */}
      {pestanaActiva === 'estadisticas' && estadisticas && (
        <div>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total_donaciones}</div>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.completadas}</div>
              <p className="text-sm text-gray-600 mt-1">Completadas</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.fallidas}</div>
              <p className="text-sm text-gray-600 mt-1">Fallidas</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(estadisticas.promedio_donacion)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Promedio</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-4 text-center">
              <div className="text-xl font-bold">
                {formatCurrency(estadisticas.total_recaudado)}
              </div>
              <p className="text-sm text-white/80 mt-1">Recaudado</p>
            </div>
          </div>

          {/* Donaciones por mes */}
          {estadisticas.por_mes && estadisticas.por_mes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-primario mb-4">Donaciones por mes</h3>
              <div className="space-y-3">
                {estadisticas.por_mes.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium text-gray-700">{item.mes}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{item.cantidad} donaciones</span>
                      <span className="font-bold text-green-600">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO: HISTORIAL */}
      {pestanaActiva === 'historial' && (
        <div>
          {/* Filtro por estado */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === '' ? 'bg-primario text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroEstado('completada')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'completada' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Completadas
            </button>
            <button
              onClick={() => setFiltroEstado('pendiente')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'pendiente' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltroEstado('fallida')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'fallida' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Fallidas
            </button>
          </div>

          {/* Tabla de donaciones */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donaciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay donaciones {filtroEstado ? `con estado "${filtroEstado}"` : ''}
                    </td>
                  </tr>
                ) : (
                  donaciones.map((donacion) => (
                    <tr key={donacion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatFecha(donacion.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {donacion.es_anonima ? (
                          <span className="text-gray-500 italic">Anónima</span>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{donacion.nombre_donante || '-'}</div>
                            <div className="text-xs text-gray-500">{donacion.email_donante || ''}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600 whitespace-nowrap">
                        {formatCurrency(donacion.monto)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {donacion.metodo_pago || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(donacion.estado)}`}>
                          {donacion.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {donacion.referencia_wompi}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={cargarDatos}
            className="mt-4 bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark"
          >
            🔄 Actualizar
          </button>
        </div>
      )}
    </div>
  );
};

export default GestionDonaciones;