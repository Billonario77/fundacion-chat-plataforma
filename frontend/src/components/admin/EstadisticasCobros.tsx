import React, { useEffect, useState } from 'react';
import { cobrosService } from '../../services/cobrosService';
import toast from 'react-hot-toast';

interface Estadisticas {
  total: number;
  pagados: number;
  pendientes: number;
  fallidos: number;
  exentos: number;
  consumidos_bolsa: number;
  total_recaudado: number;
}

const EstadisticasCobros: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await cobrosService.obtenerEstadisticas();
      if (response.success) {
        setEstadisticas(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!estadisticas) {
    return <div className="text-center py-8">No hay datos disponibles</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const items = [
    { label: 'Total de cobros', value: estadisticas.total, color: 'bg-blue-500' },
    { label: 'Pagados', value: estadisticas.pagados, color: 'bg-green-500' },
    { label: 'Pendientes', value: estadisticas.pendientes, color: 'bg-yellow-500' },
    { label: 'Fallidos', value: estadisticas.fallidos, color: 'bg-red-500' },
    { label: 'Exentos', value: estadisticas.exentos, color: 'bg-purple-500' },
    { label: 'Consumidos de bolsa', value: estadisticas.consumidos_bolsa, color: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primario mb-6">Estadísticas de Cobros</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {items.map((item) => (
          <div key={item.label} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`w-12 h-12 ${item.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>
              {item.value}
            </div>
            <p className="text-sm text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Total Recaudado</h3>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(estadisticas.total_recaudado)}</p>
      </div>

      <button
        onClick={cargarEstadisticas}
        className="mt-4 bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark"
      >
        Actualizar
      </button>
    </div>
  );
};

export default EstadisticasCobros;