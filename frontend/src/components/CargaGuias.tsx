import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

interface GuiaCarga {
  id: string;
  nombre: string;
  email: string;
  disponible: boolean;
  turnos_activos: number;
  turnos_pendientes: number;
  turnos_aceptados: number;
  turnos_en_curso: number;
  turnos_totales: number;
  turnos_proximas_24h: number;
}

const CargaGuias: React.FC = () => {
  const { user } = useAuth();
  const [guias, setGuias] = useState<GuiaCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'disponibles' | 'ocupados'>('todos');

  const cargarCargaGuias = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/carga-guias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuias(response.data.guias);
    } catch (err) {
      setError('Error al cargar la carga de guías');
      console.error(err);
      toast.error('Error al cargar datos de guías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCargaGuias();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      cargarCargaGuias();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getColorDisponibilidad = (disponible: boolean) => {
    return disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getColorCarga = (activos: number) => {
    if (activos === 0) return 'bg-green-500';
    if (activos <= 2) return 'bg-yellow-500';
    if (activos <= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const guiasFiltrados = guias.filter(guia => {
    if (filtro === 'disponibles') return guia.disponible;
    if (filtro === 'ocupados') return guia.turnos_activos > 0;
    return true;
  });

  const totalActivos = guias.reduce((sum, g) => sum + g.turnos_activos, 0);
  const guiasDisponibles = guias.filter(g => g.disponible).length;

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-primario mb-6">📊 Carga de Guías</h2>
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-primario">📊 Carga de Guías</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Total activos:</span>
            <span className="font-bold text-primario">{totalActivos}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Guías disponibles:</span>
            <span className="font-bold text-green-600">{guiasDisponibles}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'todos'
              ? 'bg-primario text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos ({guias.length})
        </button>
        <button
          onClick={() => setFiltro('disponibles')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'disponibles'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Disponibles ({guias.filter(g => g.disponible).length})
        </button>
        <button
          onClick={() => setFiltro('ocupados')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'ocupados'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Ocupados ({guias.filter(g => g.turnos_activos > 0).length})
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {guiasFiltrados.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay guías que coincidan con el filtro
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guía
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendientes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  En Curso
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximas 24h
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carga
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guiasFiltrados.map((guia) => (
                <tr key={guia.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{guia.nombre}</p>
                      <p className="text-sm text-gray-500">{guia.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorDisponibilidad(guia.disponible)}`}>
                      {guia.disponible ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">
                    {guia.turnos_activos}
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-600">
                    {guia.turnos_pendientes}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600">
                    {guia.turnos_en_curso}
                  </td>
                  <td className="px-4 py-3 text-center text-purple-600">
                    {guia.turnos_proximas_24h}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 min-w-[60px]">
                        <div
                          className={`h-2.5 rounded-full ${getColorCarga(guia.turnos_activos)} transition-all duration-500`}
                          style={{ width: `${Math.min((guia.turnos_activos / 5) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[30px]">
                        {Math.min(Math.round((guia.turnos_activos / 5) * 100), 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={cargarCargaGuias}
          className="text-sm text-primario hover:underline flex items-center gap-1"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Leyenda de colores de carga */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-center gap-4">
          <span>Nivel de carga:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Baja (0)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Media (1-2)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span>Alta (3-4)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Máxima (5+)</span>
          </span>
        </p>
      </div>
    </div>
  );
};

export default CargaGuias;