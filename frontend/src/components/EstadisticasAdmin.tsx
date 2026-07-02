import React, { useEffect, useState, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { estadisticasService, Estadisticas } from '../services/estadisticasService';
import { SkeletonStats, SkeletonChart, SkeletonTable } from './SkeletonCard';

interface Props {
  fechaInicio?: string;
  fechaFin?: string;
  onFechasChange?: (inicio: string, fin: string) => void;
  onDatosCargados?: (datos: Estadisticas) => void;
  onNavigate?: (seccion: string, filtro?: any) => void;
}

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8884D8'];

const EstadisticasAdmin: React.FC<Props> = ({ 
  fechaInicio, 
  fechaFin, 
  onFechasChange,
  onDatosCargados,
  onNavigate
}) => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState(fechaInicio || '');
  const [fechaFinLocal, setFechaFinLocal] = useState(fechaFin || '');

  const cargarEstadisticas = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      console.log('📡 Cargando estadísticas con fechas:', { fechaInicio, fechaFin });
      
      const data = await estadisticasService.getEstadisticas(fechaInicio, fechaFin);
      console.log('✅ Datos recibidos del backend:', data);
      
      setEstadisticas(data);
      
      if (onDatosCargados) {
        onDatosCargados(data);
      }
      
      if (data.fechas) {
        setFechaInicioLocal(data.fechas.inicio);
        setFechaFinLocal(data.fechas.fin);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar estadísticas:', err);
      setError(err.response?.data?.error || err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fechaInicio, fechaFin, onDatosCargados]);

  // Cargar solo cuando cambian las fechas
  useEffect(() => {
    cargarEstadisticas();
  }, [fechaInicio, fechaFin, cargarEstadisticas]);

  // Debug: mostrar datos cuando se cargan
  useEffect(() => {
    if (estadisticas) {
      console.log('📊 Datos completos de estadísticas:', estadisticas);
      console.log('📊 Turnos reprogramados:', estadisticas.turnosReprogramados);
    }
  }, [estadisticas]);

  const handleFiltrar = () => {
    if (onFechasChange && fechaInicioLocal && fechaFinLocal) {
      onFechasChange(fechaInicioLocal, fechaFinLocal);
    }
  };

  const handleRefresh = () => {
    cargarEstadisticas(true);
  };

  // Función para calcular totales por estado a partir del array turnosPorEstado
  const calcularTotalesPorEstado = () => {
    if (!estadisticas?.turnosPorEstado) return null;
    
    const totales = {
      enCurso: 0,
      completados: 0,
      cancelados: 0
    };
    
    estadisticas.turnosPorEstado.forEach(item => {
      switch (item.estado) {
        case 'aceptado':
        case 'iniciado':
          totales.enCurso += item.cantidad;
          break;
        case 'completado':
          totales.completados += item.cantidad;
          break;
        case 'cancelado':
          totales.cancelados += item.cantidad;
          break;
        default:
          break;
      }
    });
    
    return totales;
  };

  // Skeleton loading para primera carga
  if (loading && !estadisticas) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primario">📊 Estadísticas</h2>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        
        <SkeletonStats />
        
        <div className="mt-8">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <SkeletonChart />
        </div>
        
        <div className="mt-8">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <SkeletonTable />
        </div>
      </div>
    );
  }

  if (error && !estadisticas) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-primario mb-4">📊 Estadísticas</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error al cargar estadísticas</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  const totalesPorEstado = calcularTotalesPorEstado();

  return (
    <div className="card relative overflow-hidden">
      {/* Overlay de carga para refrescos manuales */}
      {refreshing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg transition-all duration-300">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3 border border-gray-100">
            <div className="w-6 h-6 border-3 border-primario border-t-transparent rounded-full animate-spin"></div>
            <span className="text-primario font-medium">Actualizando datos...</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primario">📊 Estadísticas</h2>
        <div className="flex items-center gap-3">
          {estadisticas.fechas && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {new Date(estadisticas.fechas.inicio).toLocaleDateString()} - {new Date(estadisticas.fechas.fin).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primario hover:text-primario-dark text-sm font-medium flex items-center gap-1 disabled:opacity-50 transition-all hover:scale-110"
            title="Actualizar"
          >
            <span className={`inline-block transition-transform ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`}>🔄</span>
          </button>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 transition-all hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicioLocal}
              onChange={(e) => setFechaInicioLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFinLocal}
              onChange={(e) => setFechaFinLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent transition-all"
            />
          </div>
          <div>
            <button
              onClick={handleFiltrar}
              disabled={!fechaInicioLocal || !fechaFinLocal || refreshing}
              className="w-full bg-primario text-white px-4 py-2 rounded-md hover:bg-primario-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          className="bg-blue-50 p-4 rounded-lg text-center transition-all hover:scale-105 hover:shadow-md hover:bg-blue-100 cursor-pointer"
          onClick={() => onNavigate && onNavigate('usuarios')}
        >
          <p className="text-sm text-blue-600 font-medium">Usuarios</p>
          <p className="text-3xl font-bold text-blue-700">{estadisticas.totales.usuarios}</p>
        </div>
        
        <div 
          className="bg-green-50 p-4 rounded-lg text-center transition-all hover:scale-105 hover:shadow-md hover:bg-green-100 cursor-pointer"
          onClick={() => onNavigate && onNavigate('guias')}
        >
          <p className="text-sm text-green-600 font-medium">Guías</p>
          <p className="text-3xl font-bold text-green-700">{estadisticas.totales.guias}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg text-center transition-all hover:scale-105 hover:shadow-md hover:bg-purple-100 cursor-default">
          <p className="text-sm text-purple-600 font-medium">Turnos</p>
          <p className="text-3xl font-bold text-purple-700">{estadisticas.totales.turnos}</p>
        </div>
      </div>

      {/* Turnos por Estado */}
      {estadisticas.turnosPorEstado && estadisticas.turnosPorEstado.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📈 Turnos por Estado</h3>
          
          {/* Versión simplificada */}
          {totalesPorEstado && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-yellow-50 p-3 rounded-lg transition-all hover:scale-105 hover:shadow-md cursor-default">
                <p className="text-xs text-yellow-600">En Curso</p>
                <p className="text-xl font-bold text-yellow-700">{totalesPorEstado.enCurso}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg transition-all hover:scale-105 hover:shadow-md cursor-default">
                <p className="text-xs text-gray-600">Completados</p>
                <p className="text-xl font-bold text-gray-700">{totalesPorEstado.completados}</p>
              </div>
              <div 
                className="bg-red-50 p-3 rounded-lg transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                onClick={() => onNavigate && onNavigate('cancelaciones')}
              >
                <p className="text-xs text-red-600">Cancelados</p>
                <p className="text-xl font-bold text-red-700">{totalesPorEstado.cancelados}</p>
              </div>
            </div>
          )}

        {/* Turnos Reprogramados */}
        {estadisticas.turnosReprogramados && (
          <>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 mt-6">🔄 Turnos Reprogramados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600 font-medium">Total reprogramados</p>
                <p className="text-3xl font-bold text-purple-700">{estadisticas.turnosReprogramados.total}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium mb-2">Por estado</p>
                {estadisticas.turnosReprogramados.porEstado && estadisticas.turnosReprogramados.porEstado.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {estadisticas.turnosReprogramados.porEstado.map((item) => (
                      <span key={item.estado} className="bg-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                        {item.estado}: {item.cantidad}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay turnos reprogramados en el período seleccionado</p>
                )}
              </div>
            </div>
          </>
        )}


          {/* Gráfico de pastel - Incluyendo reprogramados */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 transition-all hover:shadow-md">
            <h4 className="text-md font-medium text-gray-700 mb-3">Distribución de turnos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    ...estadisticas.turnosPorEstado.map(item => ({
                      name: item.estado,
                      value: item.cantidad
                    })),
                    {
                      name: 'reprogramados',
                      value: estadisticas.turnosReprogramados?.total || 0
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => {
                    const porcentaje = percent ? (percent * 100).toFixed(0) : 0;
                    return `${name}: ${porcentaje}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  animationDuration={500}
                  animationBegin={0}
                >
                  {[
                    ...estadisticas.turnosPorEstado.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )),
                    <Cell key="cell-reprogramado" fill={COLORS[COLORS.length - 1]} />
                  ]}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>


          {/* Tabla detallada */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Detalle por estado</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {estadisticas.turnosPorEstado.map((item) => (
                <div key={item.estado} className="bg-white p-3 rounded-lg shadow-sm transition-all hover:scale-105 hover:shadow-md cursor-default">
                  <p className="text-xs text-gray-600 capitalize">{item.estado}</p>
                  <p className="text-xl font-bold text-gray-700">{item.cantidad}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Turnos por día */}
      {estadisticas.turnosPorDia && estadisticas.turnosPorDia.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📅 Evolución diaria de turnos</h3>
          
          {/* Gráfico de líneas */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 transition-all hover:shadow-md">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={estadisticas.turnosPorDia.map(d => ({
                  ...d,
                  fecha: new Date(d.fecha).toLocaleDateString()
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                  animationDuration={500}
                  name="Turnos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de datos */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto transition-all hover:shadow-md">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-right py-2">Turnos</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.turnosPorDia.map((dia) => (
                  <tr key={dia.fecha} className="border-b last:border-0 hover:bg-gray-100 transition-colors">
                    <td className="py-2">{new Date(dia.fecha).toLocaleDateString()}</td>
                    <td className="text-right py-2 font-medium">{dia.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Guías más activos */}
      {estadisticas.guiasMasActivos && estadisticas.guiasMasActivos.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🏆 Guías más activos</h3>
          
          {/* Gráfico de barras */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 transition-all hover:shadow-md">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={estadisticas.guiasMasActivos}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="totalTurnos" 
                  fill="#8884d8"
                  animationDuration={500}
                  name="Turnos"
                >
                  {estadisticas.guiasMasActivos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de guías */}
          <div className="space-y-2 mb-6">
            {estadisticas.guiasMasActivos.map((guia, index) => (
              <div 
                key={guia.id} 
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg transition-all hover:scale-[1.02] hover:shadow-md hover:bg-gray-100 cursor-pointer"
                onClick={() => onNavigate && onNavigate('guias', { guiaId: guia.id, guiaNombre: guia.nombre })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">{index + 1}.</span>
                  <span className="font-medium">{guia.nombre}</span>
                  <span className="text-sm text-gray-500">{guia.email}</span>
                </div>
                <span className="bg-primario text-white px-2 py-1 rounded-full text-xs font-medium">
                  {guia.totalTurnos} turnos
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EstadisticasAdmin;