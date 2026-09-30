import React, { useEffect, useMemo, useState } from 'react';
import { cobrosService, Entidad, ReporteConsumo, ConsumoItem } from '../../services/cobrosService';
import toast from 'react-hot-toast';

const GestionEntidades: React.FC = () => {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
    const [formData, setFormData] = useState<{
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    identificador: string;
    contactoNombre: string;
    contactoEmail: string;
    contactoTelefono: string;
    descuentoPorcentaje: number | '';
    bolsaHorasInicial: number | '';
  }>({
    nombre: '',
    tipo: 'empresa',
    identificador: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    descuentoPorcentaje: '',
    bolsaHorasInicial: ''
  });

  // Modal agregar horas
  const [modalHoras, setModalHoras] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    horas: number;
  }>({ abierto: false, entidad: null, horas: 0 });

  // Modal detalle / reporte mensual
  const [modalDetalle, setModalDetalle] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    desde: string;
    hasta: string;
    cargando: boolean;
    reporte: ReporteConsumo | null;
  }>({
    abierto: false,
    entidad: null,
    desde: '',
    hasta: '',
    cargando: false,
    reporte: null
  });

  useEffect(() => {
    cargarEntidades();
  }, []);

  const cargarEntidades = async () => {
    try {
      setLoading(true);
      const data = await cobrosService.obtenerEntidades();
      setEntidades(data);
    } catch (error) {
      toast.error('Error al cargar convenios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cobrosService.crearEntidad({
        nombre: formData.nombre,
        tipo: formData.tipo,
        identificador: formData.identificador,
        contactoNombre: formData.contactoNombre,
        contactoEmail: formData.contactoEmail,
        contactoTelefono: formData.contactoTelefono,
        descuentoPorcentaje:
          formData.descuentoPorcentaje === '' ? 0 : Number(formData.descuentoPorcentaje),
        bolsaHorasInicial:
          formData.bolsaHorasInicial === '' ? 0 : Number(formData.bolsaHorasInicial)
      });
      toast.success('Convenio creado exitosamente');
      setShowModal(false);
      setFormData({
        nombre: '',
        tipo: 'empresa',
        identificador: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        descuentoPorcentaje: '',
        bolsaHorasInicial: ''
      });
      cargarEntidades();
    } catch (error) {
      toast.error('Error al crear convenio');
    }
  };

  // Filtro local por nombre / identificador / contacto
  const entidadesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return entidades;
    return entidades.filter((e) =>
      (e.nombre || '').toLowerCase().includes(q) ||
      (e.identificador || '').toLowerCase().includes(q) ||
      (e.contacto_nombre || '').toLowerCase().includes(q) ||
      (e.contacto_email || '').toLowerCase().includes(q)
    );
  }, [entidades, busqueda]);

  // ============================================
  // AGREGAR HORAS
  // ============================================
  const abrirModalHoras = (entidad: Entidad, e: React.MouseEvent) => {
    e.stopPropagation(); // que no abra el modal de detalle
    setModalHoras({ abierto: true, entidad, horas: 0 });
  };

  const handleAgregarHoras = async () => {
    if (!modalHoras.entidad) return;
    if (!modalHoras.horas || modalHoras.horas <= 0) {
      toast.error('Ingresa una cantidad de horas mayor a 0');
      return;
    }
    try {
      await cobrosService.agregarHorasBolsa(modalHoras.entidad.id, modalHoras.horas);
      toast.success(`${modalHoras.horas} hora(s) agregada(s)`);
      setModalHoras({ abierto: false, entidad: null, horas: 0 });
      cargarEntidades();
    } catch (err) {
      toast.error('Error al agregar horas');
      console.error(err);
    }
  };

  // ============================================
  // DETALLE / REPORTE
  // ============================================
  const formatFecha = (d: Date) => d.toISOString().slice(0, 10);

  const abrirDetalle = (entidad: Entidad) => {
    const hoy = new Date();
    const primerDia = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
    const ultimoDia = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0));

    setModalDetalle({
      abierto: true,
      entidad,
      desde: formatFecha(primerDia),
      hasta: formatFecha(ultimoDia),
      cargando: false,
      reporte: null
    });

    // Cargar automáticamente el reporte del mes actual
    cargarReporte(entidad.id, formatFecha(primerDia), formatFecha(ultimoDia));
  };

  const cargarReporte = async (entidadId: string, desde: string, hasta: string) => {
    try {
      setModalDetalle((m) => ({ ...m, cargando: true, reporte: null }));
      const data = await cobrosService.obtenerConsumoPeriodo(entidadId, desde, hasta);
      setModalDetalle((m) => ({ ...m, cargando: false, reporte: data }));
    } catch (err) {
      toast.error('Error al generar el reporte');
      console.error(err);
      setModalDetalle((m) => ({ ...m, cargando: false }));
    }
  };

  const handleGenerarReporte = () => {
    if (!modalDetalle.entidad) return;
    if (!modalDetalle.desde || !modalDetalle.hasta) {
      toast.error('Selecciona las fechas');
      return;
    }
    cargarReporte(modalDetalle.entidad.id, modalDetalle.desde, modalDetalle.hasta);
  };

  // Agrupa los consumos por usuario
  const agruparPorUsuario = (consumos: ConsumoItem[]) => {
    const mapa = new Map<string, {
      usuario_id: string;
      nombre: string;
      email: string;
      celular: string;
      horas: number;
      sesiones: number;
    }>();

    consumos.forEach((c) => {
      const id = c.usuario_id;
      const horas = parseFloat(String(c.horas_consumidas));
      const existente = mapa.get(id);

      if (existente) {
        existente.horas += horas;
        existente.sesiones += 1;
      } else {
        mapa.set(id, {
          usuario_id: id,
          nombre: c.usuario_nombre || 'Usuario',
          email: c.usuario_email || '',
          celular: c.usuario_celular || c.usuario_telefono || '',
          horas,
          sesiones: 1
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) => b.horas - a.horas);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-primario">Gestión de Convenios</h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark whitespace-nowrap"
        >
          + Nuevo Convenio
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, NIT, contacto..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {entidadesFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {busqueda ? 'No se encontraron convenios con ese criterio' : 'No hay convenios creados todavía'}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Convenio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entidadesFiltradas.map((entidad) => (
                <tr
                  key={entidad.id}
                  onClick={() => abrirDetalle(entidad)}
                  className="hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{entidad.nombre}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {entidad.identificador || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {entidad.tipo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="min-w-0">
                      <div className="truncate">{entidad.contacto_nombre || '—'}</div>
                      {entidad.contacto_email && (
                        <div className="text-xs text-gray-400 truncate">
                          {entidad.contacto_email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className="font-semibold text-green-700">
                      {entidad.bolsa_horas_restantes}
                    </span>
                    <span className="text-gray-400 text-xs"> / {entidad.bolsa_horas_inicial}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {entidad.descuento_porcentaje}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => abrirModalHoras(entidad, e)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-xs whitespace-nowrap"
                    >
                      + Horas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear convenio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Nuevo Convenio</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Biozynex S.A.S."
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  >
                    <option value="empresa">Empresa</option>
                    <option value="ong">Colegio / Universidad / ONG</option>
                    <option value="gobierno">Entidad Estatal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identificador (NIT)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 900123456-7"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.identificador}
                    onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: María Pérez"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.contactoNombre}
                    onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo del contacto
                  </label>
                  <input
                    type="email"
                    placeholder="Ej: contacto@empresa.com"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.contactoEmail}
                    onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono del contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +57 300 123 4567"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.contactoTelefono}
                    onChange={(e) => setFormData({ ...formData, contactoTelefono: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej: 20 (dejar vacío = sin descuento)"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.descuentoPorcentaje}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descuentoPorcentaje: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas iniciales en la bolsa
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 40 (dejar vacío = 0 horas)"
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.bolsaHorasInicial}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bolsaHorasInicial: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  type="submit"
                  className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark flex-1"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal agregar horas */}
      {modalHoras.abierto && modalHoras.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-primario">Agregar horas</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convenio: <span className="font-medium">{modalHoras.entidad.nombre}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Bolsa actual:{' '}
              <span className="font-semibold">{modalHoras.entidad.bolsa_horas_restantes} horas</span>
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas a agregar
            </label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded mb-4"
              value={modalHoras.horas || ''}
              onChange={(e) =>
                setModalHoras({ ...modalHoras, horas: Number(e.target.value) })
              }
            />

            <div className="flex gap-2">
              <button
                onClick={handleAgregarHoras}
                disabled={!modalHoras.horas || modalHoras.horas <= 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setModalHoras({ abierto: false, entidad: null, horas: 0 })}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle del convenio */}
      {modalDetalle.abierto && modalDetalle.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-primario truncate">
                  {modalDetalle.entidad.nombre}
                </h3>
                <p className="text-sm text-gray-600">
                  {modalDetalle.entidad.identificador
                    ? `NIT: ${modalDetalle.entidad.identificador}`
                    : 'Sin NIT'}
                  {' · '}
                  Bolsa: {modalDetalle.entidad.bolsa_horas_restantes} / {modalDetalle.entidad.bolsa_horas_inicial} h
                </p>
              </div>
              <button
                onClick={() => setModalDetalle({
                  abierto: false, entidad: null, desde: '', hasta: '', cargando: false, reporte: null
                })}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Selector de fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={modalDetalle.desde}
                  onChange={(e) => setModalDetalle({ ...modalDetalle, desde: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={modalDetalle.hasta}
                  onChange={(e) => setModalDetalle({ ...modalDetalle, hasta: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerarReporte}
                  disabled={modalDetalle.cargando}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {modalDetalle.cargando ? 'Generando...' : 'Actualizar'}
                </button>
              </div>
            </div>

            {modalDetalle.cargando && (
              <div className="text-center py-8 text-gray-500">Cargando consumos...</div>
            )}

            {modalDetalle.reporte && !modalDetalle.cargando && (
              <div>
                {/* Resumen */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Horas consumidas</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {modalDetalle.reporte.total_horas.toFixed(2)} h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Sesiones</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {modalDetalle.reporte.consumos.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Usuarios activos</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {agruparPorUsuario(modalDetalle.reporte.consumos).length}
                    </p>
                  </div>
                </div>

                {modalDetalle.reporte.consumos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay consumos en este período
                  </p>
                ) : (
                  <>
                    {/* Resumen por usuario */}
                    <h4 className="font-semibold text-gray-800 mb-2">Resumen por usuario</h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Nombre</th>
                            <th className="px-3 py-2 text-left">Correo</th>
                            <th className="px-3 py-2 text-left">Celular</th>
                            <th className="px-3 py-2 text-right">Sesiones</th>
                            <th className="px-3 py-2 text-right">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {agruparPorUsuario(modalDetalle.reporte.consumos).map((u) => (
                            <tr key={u.usuario_id}>
                              <td className="px-3 py-2">{u.nombre}</td>
                              <td className="px-3 py-2 text-gray-600">{u.email || '—'}</td>
                              <td className="px-3 py-2 text-gray-600">{u.celular || '—'}</td>
                              <td className="px-3 py-2 text-right">{u.sesiones}</td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {u.horas.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Detalle cronológico */}
                    <h4 className="font-semibold text-gray-800 mb-2">Detalle de sesiones</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Fecha y hora</th>
                            <th className="px-3 py-2 text-left">Usuario</th>
                            <th className="px-3 py-2 text-left">Correo</th>
                            <th className="px-3 py-2 text-left">Celular</th>
                            <th className="px-3 py-2 text-right">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {modalDetalle.reporte.consumos.map((c) => (
                            <tr key={c.id}>
                              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                {new Date(c.fecha_consumo).toLocaleString('es-CO', {
                                  timeZone: 'America/Bogota',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="px-3 py-2">{c.usuario_nombre || '—'}</td>
                              <td className="px-3 py-2 text-gray-600">{c.usuario_email || '—'}</td>
                              <td className="px-3 py-2 text-gray-600">
                                {c.usuario_celular || c.usuario_telefono || '—'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {parseFloat(String(c.horas_consumidas)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEntidades;