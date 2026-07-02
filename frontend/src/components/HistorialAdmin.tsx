import React, { useState, useEffect } from 'react';
import { turnosService } from '../services/turnosService';
import { adminService } from '../services/adminService';

interface TurnoHistorial {
  id: string;
  fecha_programada: string;
  estado: string;
  modalidad: string;
  created_at: string;
  motivo_cancelacion: string | null;
  cancelado_por: string | null;
  es_reprogramacion: boolean;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  guia_id: string;
  guia_nombre: string;
  guia_email: string;
}

const HistorialAdmin: React.FC = () => {
  const [turnos, setTurnos] = useState<TurnoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guias, setGuias] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    estado: '',
    usuario_id: '',
    guia_id: ''
  });

  // Estados para los selects
  const estados = ['pendiente', 'aceptado', 'iniciado', 'completado', 'cancelado', 'reprogramado'];

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await turnosService.getHistorialAdmin({
        ...filtros,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      setTurnos(response.data);
      setPagination({
        ...pagination,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems
      });
    } catch (err) {
      setError('Error al cargar historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    cargarListas();
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [pagination.currentPage, filtros]);

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

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aceptado: 'bg-blue-100 text-blue-800',
      iniciado: 'bg-green-100 text-green-800',
      completado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const exportarCSV = () => {
    const data = turnos.map(t => ({
      ID: t.id,
      'Fecha programada': formatFecha(t.fecha_programada),
      Estado: t.estado,
      Modalidad: t.modalidad,
      Usuario: t.usuario_nombre,
      'Email usuario': t.usuario_email,
      Guía: t.guia_nombre || 'Sin asignar',
      'Email guía': t.guia_email || '',
      Motivo: t.motivo_cancelacion || '',
      'Cancelado por': t.cancelado_por || '',
      'Es reprogramación': t.es_reprogramacion ? 'Sí' : 'No'
    }));

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-turnos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && turnos.length === 0) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-primario mb-6">📋 Historial de Turnos</h2>
        <div className="text-center py-8 text-gray-500">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primario">📋 Historial de Turnos</h2>
        <button
          onClick={exportarCSV}
          disabled={turnos.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          📥 Exportar CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
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
            <label className="block text-sm text-gray-600">Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="input text-sm"
            >
              <option value="">Todos</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Guía</label>
            <select
              name="guia_id"
              value={filtros.guia_id}
              onChange={handleFiltroChange}
              className="input text-sm"
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
              className="input text-sm"
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modalidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {turnos.map((turno) => (
              <tr key={turno.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatFecha(turno.fecha_programada)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{turno.usuario_nombre}</div>
                  <div className="text-xs text-gray-500">{turno.usuario_email}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {turno.guia_nombre ? (
                    <>
                      <div className="font-medium">{turno.guia_nombre}</div>
                      <div className="text-xs text-gray-500">{turno.guia_email}</div>
                    </>
                  ) : (
                    <span className="text-gray-400">Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                      {turno.estado}
                    </span>
                    {turno.es_reprogramacion && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Reprogramado
                      </span>
                    )}
                  </div>
                  {turno.cancelado_por && (
                    <div className="text-xs text-gray-500 mt-1">
                      por: {turno.cancelado_por}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm capitalize">{turno.modalidad}</td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">
                  {turno.motivo_cancelacion || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t flex justify-between items-center mt-4">
          <button
            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalItems} turnos)
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
  );
};

export default HistorialAdmin;