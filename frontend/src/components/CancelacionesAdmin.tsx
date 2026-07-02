import React, { useState, useEffect } from 'react';
import { turnosService } from '../services/turnosService';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';

interface Cancelacion {
  id: string;
  fecha_cancelacion: string;
  fecha_programada: string;
  motivo_cancelacion: string;
  cancelado_por: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  guia_id: string;
  guia_nombre: string;
  guia_email: string;
}

const CancelacionesAdmin: React.FC = () => {
  const { user } = useAuth();
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [metricas, setMetricas] = useState({
    total: 0,
    porRol: [] as { cancelado_por: string; count: number }[],
    topGuias: [] as { nombre: string; count: number }[],
    topUsuarios: [] as { nombre: string; count: number }[]
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    cancelado_por: '',
    guia_id: '',
    usuario_id: ''
  });

  const [guias, setGuias] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);

  const cargarCancelaciones = async () => {
    try {
      setLoading(true);
      const response = await turnosService.obtenerCancelacionesAdmin({
        ...filtros,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      setCancelaciones(response.data);
      setPagination({
        ...pagination,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems
      });
    } catch (err) {
      setError('Error al cargar cancelaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      const data = await turnosService.obtenerMetricasCancelaciones();
      setMetricas(data);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
    }
  };

    useEffect(() => {
        if (user?.rol === 'admin') {
        cargarMetricas();
        cargarCancelaciones();
        }
    }, [user]);

    useEffect(() => {
        if (user?.rol === 'admin') {
        cargarCancelaciones();
        }
    }, [pagination.currentPage, filtros]);


  // Cargar listas de guías y usuarios para filtros
    useEffect(() => {
    const cargarListas = async () => {
        try {
        const [guiasData, usuariosData] = await Promise.all([
            adminService.obtenerGuiasLista(),
            adminService.obtenerUsuariosLista()
        ]);
        setGuias(guiasData);
        setUsuarios(usuariosData);
        } catch (err) {
        console.error('Error al cargar listas:', err);
        }
    };
    cargarListas();
    }, []);

    // Limpiar filtros dependientes cuando cambia cancelado_por
    useEffect(() => {
    if (filtros.cancelado_por === 'guia') {
        setFiltros(prev => ({ ...prev, usuario_id: '' }));
    } else if (filtros.cancelado_por === 'usuario') {
        setFiltros(prev => ({ ...prev, guia_id: '' }));
    }
    }, [filtros.cancelado_por]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorRol = (rol: string) => {
    switch (rol) {
      case 'usuario': return 'bg-blue-100 text-blue-800';
      case 'guia': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && cancelaciones.length === 0) {
    return <div className="text-center py-8">Cargando cancelaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primario">Cancelaciones</h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total cancelaciones</p>
          <p className="text-3xl font-bold text-primario">{metricas.total}</p>
        </div>
        {metricas.porRol.map((rol) => (
          <div key={rol.cancelado_por} className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Cancelado por {rol.cancelado_por === 'usuario' ? 'Usuarios' : rol.cancelado_por === 'guia' ? 'Guías' : 'Admin'}</p>
            <p className="text-3xl font-bold text-primario">{rol.count}</p>
          </div>
        ))}
      </div>

      {/* Top guías y usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Top Guías con cancelaciones</h3>
          {metricas.topGuias.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos</p>
          ) : (
            <ul className="space-y-2">
              {metricas.topGuias.map((guia, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{guia.nombre}</span>
                  <span className="font-medium text-red-600">{guia.count} cancelaciones</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Top Usuarios con cancelaciones</h3>
          {metricas.topUsuarios.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos</p>
          ) : (
            <ul className="space-y-2">
              {metricas.topUsuarios.map((usuario, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{usuario.nombre}</span>
                  <span className="font-medium text-red-600">{usuario.count} cancelaciones</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600">Fecha desde</label>
            <input
              type="date"
              name="fecha_desde"
              value={filtros.fecha_desde}
              onChange={handleFiltroChange}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Fecha hasta</label>
            <input
              type="date"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              onChange={handleFiltroChange}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Cancelado por</label>
            <select
              name="cancelado_por"
              value={filtros.cancelado_por}
              onChange={handleFiltroChange}
              className="input text-sm"
            >
              <option value="">Todos</option>
              <option value="usuario">Usuario</option>
              <option value="guia">Guía</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Guía</label>
            <select
                name="guia_id"
                value={filtros.guia_id}
                onChange={handleFiltroChange}
                disabled={filtros.cancelado_por === 'usuario'}
                className={`input text-sm ${filtros.cancelado_por === 'usuario' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                <option value="">Todos los guías</option>
                {guias.map(guia => (
                <option key={guia.id} value={guia.id}>
                    {guia.nombre}
                </option>
                ))}
            </select>
        </div>
        <div>
            <label className="block text-sm text-gray-600">Usuario</label>
            <select
                name="usuario_id"
                value={filtros.usuario_id}
                onChange={handleFiltroChange}
                disabled={filtros.cancelado_por === 'guia'}
                className={`input text-sm ${filtros.cancelado_por === 'guia' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                <option value="">Todos los usuarios</option>
                {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                </option>
                ))}
            </select>
        </div>
        </div>
      </div>

      {/* Tabla de cancelaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha cancelación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha turno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancelado por</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cancelaciones.map((cancelacion) => (
                <tr key={cancelacion.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatFecha(cancelacion.fecha_cancelacion)}</td>
                  <td className="px-4 py-3 text-sm">{formatFecha(cancelacion.fecha_programada)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{cancelacion.usuario_nombre || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{cancelacion.usuario_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{cancelacion.guia_nombre || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{cancelacion.guia_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorRol(cancelacion.cancelado_por)}`}>
                      {cancelacion.cancelado_por === 'usuario' ? 'Usuario' : cancelacion.cancelado_por === 'guia' ? 'Guía' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{cancelacion.motivo_cancelacion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelacionesAdmin;