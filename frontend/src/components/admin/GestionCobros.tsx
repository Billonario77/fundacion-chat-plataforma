import React, { useEffect, useState } from 'react';
import { cobrosService } from '../../services/cobrosService';
import toast from 'react-hot-toast';

interface Cobro {
  id: string;
  turno_id: string;
  usuario_id: string;
  guia_id: string;
  entidad_id?: string;
  duracion_minutos: number;
  costo_por_hora: number;
  descuento_porcentaje: number;
  descuento_aplicado: number;
  total: number;
  monto_multas: number;
  tipo: 'sesion' | 'multa';
  concepto?: string;
  estado: 'pendiente' | 'pagado' | 'fallido' | 'exento' | 'consumido_bolsa' | 'condonada';
  metodo_pago?: string;
  comprobante_url?: string;
  pagado_at?: string;
  created_at: string;
  referencia_wompi?: string;
  usuario_nombre: string;
  usuario_email: string;
  guia_nombre: string;
  fecha_programada: string;
  turno_estado: string;
}

interface Estadisticas {
  total: string;
  pagados: string;
  pendientes: string;
  fallidos: string;
  exentos: string;
  consumidos_bolsa: string;
  total_recaudado: string;
}

const GestionCobros: React.FC = () => {
  const [cobros, setCobros] = useState<Cobro[]>([]);
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
      const statsResponse = await cobrosService.obtenerEstadisticas();
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }

      // Cargar cobros con filtro
      const filtros = filtroEstado ? { estado: filtroEstado } : undefined;
      const cobrosResponse = await cobrosService.obtenerCobros(filtros);
      if (cobrosResponse.success) {
        setCobros(cobrosResponse.data);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar cobros');
    } finally {
      setLoading(false);
    }
  };

    const handleCondonarMulta = async (multaId: string, monto: number) => {
    if (!window.confirm(
      `¿Condonar esta multa de ${formatCurrency(monto)}?\n\n` +
      `Se eliminará la deuda del usuario. Si la multa estaba incluida en una sesión pendiente, el total de esa sesión se ajustará automáticamente.`
    )) return;

    try {
      await cobrosService.condonarMulta(multaId);
      toast.success('Multa condonada exitosamente');
      cargarDatos();
    } catch (err: any) {
      console.error('Error al condonar multa:', err);
      toast.error(err?.response?.data?.error || 'Error al condonar la multa');
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
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'fallido': return 'bg-red-100 text-red-800';
      case 'exento': return 'bg-purple-100 text-purple-800';
      case 'consumido_bolsa': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pagado': return '✅ Pagado';
      case 'pendiente': return '⏳ Pendiente';
      case 'fallido': return '❌ Fallido';
      case 'exento': return '💜 Exento';
      case 'consumido_bolsa': return '🎁 Bolsa';
      default: return estado;
    }
  };

  if (loading && !estadisticas) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primario mb-6">Cobros de Sesiones</h2>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.pagados}</div>
              <p className="text-sm text-gray-600 mt-1">Pagados</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.fallidos}</div>
              <p className="text-sm text-gray-600 mt-1">Fallidos</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{estadisticas.exentos}</div>
              <p className="text-sm text-gray-600 mt-1">Exentos</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-4 text-center">
              <div className="text-xl font-bold">
                {formatCurrency(estadisticas.total_recaudado || 0)}
              </div>
              <p className="text-sm text-white/80 mt-1">Recaudado</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-primario mb-3">Consumidos de bolsa</h3>
            <p className="text-2xl font-bold text-blue-600">{estadisticas.consumidos_bolsa || 0}</p>
          </div>
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
              Todos
            </button>
            <button
              onClick={() => setFiltroEstado('pagado')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'pagado' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Pagados
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
              onClick={() => setFiltroEstado('exento')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'exento' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Exentos
            </button>
            <button
              onClick={() => setFiltroEstado('consumido_bolsa')}
              className={`px-3 py-1 rounded-full text-sm ${
                filtroEstado === 'consumido_bolsa' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Bolsa
            </button>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cobros.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No hay cobros {filtroEstado ? `con estado "${filtroEstado}"` : ''}
                    </td>
                  </tr>
                ) : (
                  cobros.map((cobro) => (
                    <tr key={cobro.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatFecha(cobro.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{cobro.usuario_nombre}</div>
                        <div className="text-xs text-gray-500">{cobro.usuario_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {cobro.tipo === 'multa' ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            Multa
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Sesión
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {cobro.guia_nombre}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600 whitespace-nowrap">
                        {formatCurrency(cobro.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(cobro.estado)}`}>
                          {getEstadoLabel(cobro.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {cobro.metodo_pago || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {cobro.tipo === 'multa' && cobro.estado === 'pendiente' ? (
                          <button
                            onClick={() => handleCondonarMulta(cobro.id, Number(cobro.total))}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full font-medium transition-colors"
                          >
                            Condonar
                          </button>
                        ) : cobro.tipo === 'multa' && cobro.estado === 'condonada' ? (
                          <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full font-medium">
                            Condonada
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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

export default GestionCobros;