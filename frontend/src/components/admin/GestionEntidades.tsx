import React, { useEffect, useState } from 'react';
import { cobrosService, Entidad, ReporteConsumo } from '../../services/cobrosService';
import toast from 'react-hot-toast';

const GestionEntidades: React.FC = () => {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    identificador: string;
    contactoNombre: string;
    contactoEmail: string;
    contactoTelefono: string;
    descuentoPorcentaje: number;
    bolsaHorasInicial: number;
  }>({
    nombre: '',
    tipo: 'empresa',
    identificador: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    descuentoPorcentaje: 0,
    bolsaHorasInicial: 0
  });

  // Modal agregar horas
  const [modalHoras, setModalHoras] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    horas: number;
  }>({
    abierto: false,
    entidad: null,
    horas: 0
  });

  // Modal reporte mensual
  const [modalReporte, setModalReporte] = useState<{
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
      toast.error('Error al cargar entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cobrosService.crearEntidad(formData);
      toast.success('Convenio creado exitosamente');
      setShowModal(false);
      setFormData({
        nombre: '',
        tipo: 'empresa',
        identificador: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        descuentoPorcentaje: 0,
        bolsaHorasInicial: 0
      });
      cargarEntidades();
    } catch (error) {
      toast.error('Error al crear convenio');
    }
  };

  // ============================================
  // AGREGAR HORAS
  // ============================================
  const abrirModalHoras = (entidad: Entidad) => {
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
  // REPORTE MENSUAL
  // ============================================
  const abrirModalReporte = (entidad: Entidad) => {
    // Por defecto: mes actual
    const hoy = new Date();
    const primerDia = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
    const ultimoDia = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0));

    const formatFecha = (d: Date) => d.toISOString().slice(0, 10);

    setModalReporte({
      abierto: true,
      entidad,
      desde: formatFecha(primerDia),
      hasta: formatFecha(ultimoDia),
      cargando: false,
      reporte: null
    });
  };

  const handleGenerarReporte = async () => {
    if (!modalReporte.entidad) return;
    if (!modalReporte.desde || !modalReporte.hasta) {
      toast.error('Selecciona las fechas');
      return;
    }

    try {
      setModalReporte((m) => ({ ...m, cargando: true, reporte: null }));
      const data = await cobrosService.obtenerConsumoPeriodo(
        modalReporte.entidad.id,
        modalReporte.desde,
        modalReporte.hasta
      );
      setModalReporte((m) => ({ ...m, cargando: false, reporte: data }));
    } catch (err) {
      toast.error('Error al generar el reporte');
      console.error(err);
      setModalReporte((m) => ({ ...m, cargando: false }));
    }
  };

  // Agrupa los consumos por usuario para el resumen
  const agruparPorUsuario = (reporte: ReporteConsumo) => {
    const mapa = new Map<string, {
      usuario_id: string;
      nombre: string;
      email: string;
      horas: number;
      sesiones: number;
    }>();

    reporte.consumos.forEach((c) => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-primario">Gestión de Convenios</h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark whitespace-nowrap"
        >
          + Nuevo Convenio
        </button>
      </div>

      {entidades.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay convenios creados todavía
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entidades.map((entidad) => (
            <div key={entidad.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg truncate">{entidad.nombre}</h3>
              <p className="text-sm text-gray-600">Tipo: {entidad.tipo}</p>
              <p className="text-sm text-gray-600">
                Horas restantes:{' '}
                <span className="font-semibold">{entidad.bolsa_horas_restantes}</span>
              </p>
              <p className="text-sm text-gray-600">
                Descuento: <span className="font-semibold">{entidad.descuento_porcentaje}%</span>
              </p>
              {entidad.identificador && (
                <p className="text-sm text-gray-600">ID: {entidad.identificador}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => abrirModalHoras(entidad)}
                  className="flex-1 min-w-[120px] bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                >
                  + Horas
                </button>
                <button
                  onClick={() => abrirModalReporte(entidad)}
                  className="flex-1 min-w-[120px] bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  Reporte mensual
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear convenio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Nuevo Convenio</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full p-2 border rounded"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
                <select
                  className="w-full p-2 border rounded"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <option value="empresa">Empresa</option>
                  <option value="ong">Colegio / Universidad / ONG</option>
                  <option value="gobierno">Entidad Estatal</option>
                </select>
                <input
                  type="text"
                  placeholder="Identificador (NIT)"
                  className="w-full p-2 border rounded"
                  value={formData.identificador}
                  onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Contacto Nombre"
                  className="w-full p-2 border rounded"
                  value={formData.contactoNombre}
                  onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Contacto Email"
                  className="w-full p-2 border rounded"
                  value={formData.contactoEmail}
                  onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Contacto Teléfono"
                  className="w-full p-2 border rounded"
                  value={formData.contactoTelefono}
                  onChange={(e) => setFormData({ ...formData, contactoTelefono: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Descuento %"
                  className="w-full p-2 border rounded"
                  value={formData.descuentoPorcentaje}
                  onChange={(e) => setFormData({ ...formData, descuentoPorcentaje: Number(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Horas iniciales"
                  className="w-full p-2 border rounded"
                  value={formData.bolsaHorasInicial}
                  onChange={(e) => setFormData({ ...formData, bolsaHorasInicial: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
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

      {/* Modal reporte mensual */}
      {modalReporte.abierto && modalReporte.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 text-primario">Reporte de consumo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convenio: <span className="font-medium">{modalReporte.entidad.nombre}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={modalReporte.desde}
                  onChange={(e) => setModalReporte({ ...modalReporte, desde: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={modalReporte.hasta}
                  onChange={(e) => setModalReporte({ ...modalReporte, hasta: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerarReporte}
                  disabled={modalReporte.cargando}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {modalReporte.cargando ? 'Generando...' : 'Generar'}
                </button>
              </div>
            </div>

            {modalReporte.reporte && (
              <div className="mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Total de horas consumidas:</span>{' '}
                    {modalReporte.reporte.total_horas.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Bolsa restante actual:</span>{' '}
                    {modalReporte.reporte.entidad.bolsa_horas_restantes} horas
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Precio referencia sesión:</span> $
                    {modalReporte.reporte.precio_sesion_referencia.toLocaleString('es-CO')}
                  </p>
                </div>

                {modalReporte.reporte.consumos.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No hay consumos en este período
                  </p>
                ) : (
                  <>
                    <h4 className="font-semibold text-gray-800 mb-2">Resumen por usuario</h4>
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Usuario</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-right">Sesiones</th>
                            <th className="px-3 py-2 text-right">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {agruparPorUsuario(modalReporte.reporte).map((u) => (
                            <tr key={u.usuario_id}>
                              <td className="px-3 py-2">{u.nombre}</td>
                              <td className="px-3 py-2 text-gray-600">{u.email}</td>
                              <td className="px-3 py-2 text-right">{u.sesiones}</td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {u.horas.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Ver detalle ({modalReporte.reporte.consumos.length} registros)
                      </summary>
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left">Fecha</th>
                              <th className="px-2 py-1 text-left">Usuario</th>
                              <th className="px-2 py-1 text-right">Horas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {modalReporte.reporte.consumos.map((c) => (
                              <tr key={c.id}>
                                <td className="px-2 py-1">
                                  {new Date(c.fecha_consumo).toLocaleString('es-CO', {
                                    timeZone: 'America/Bogota'
                                  })}
                                </td>
                                <td className="px-2 py-1">{c.usuario_nombre || '—'}</td>
                                <td className="px-2 py-1 text-right">
                                  {parseFloat(String(c.horas_consumidas)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() =>
                  setModalReporte({
                    abierto: false,
                    entidad: null,
                    desde: '',
                    hasta: '',
                    cargando: false,
                    reporte: null
                  })
                }
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEntidades;