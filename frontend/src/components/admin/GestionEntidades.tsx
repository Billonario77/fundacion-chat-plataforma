import React, { useEffect, useMemo, useState } from 'react';
import { cobrosService, Entidad, ReporteConsumo, ConsumoItem, Cupon } from '../../services/cobrosService';
import toast from 'react-hot-toast';

const GestionEntidades: React.FC = () => {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    modalidad: 'descuento' | 'bolsa';
    identificador: string;
    contactoNombre: string;
    contactoEmail: string;
    contactoTelefono: string;
    bolsaHorasInicial: number | '';
    dominioCorporativo: string;
  }>({
    nombre: '',
    tipo: 'empresa',
    modalidad: 'descuento',
    identificador: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    bolsaHorasInicial: '',
    dominioCorporativo: ''
  });

  const [modalHoras, setModalHoras] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    horas: number;
  }>({ abierto: false, entidad: null, horas: 0 });

  const [modalDetalle, setModalDetalle] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    desde: string;
    hasta: string;
    cargando: boolean;
    reporte: ReporteConsumo | null;
    cupones: Cupon[];
    cargandoCupones: boolean;
    usuarios: any[];
    cargandoUsuarios: boolean;
  }>({
    abierto: false,
    entidad: null,
    desde: '',
    hasta: '',
    cargando: false,
    reporte: null,
    cupones: [],
    cargandoCupones: false,
    usuarios: [],
    cargandoUsuarios: false
  });

  const [modalCupon, setModalCupon] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    codigo: string;
    valor: number | '';
    usosMaximos: number | '';
    fechaExpiracion: string;
  }>({
    abierto: false,
    entidad: null,
    codigo: '',
    valor: '',
    usosMaximos: '',
    fechaExpiracion: ''
  });

  const [modalAsignar, setModalAsignar] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    email: string;
  }>({ abierto: false, entidad: null, email: '' });

  const [modalMasivo, setModalMasivo] = useState<{
    abierto: boolean;
    entidad: Entidad | null;
    texto: string;
    procesando: boolean;
    resultados: any[] | null;
  }>({ abierto: false, entidad: null, texto: '', procesando: false, resultados: null });

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

    if (formData.modalidad === 'bolsa' && !formData.dominioCorporativo.trim()) {
      toast.error('Los convenios de bolsa requieren un dominio corporativo');
      return;
    }

    try {
      await cobrosService.crearEntidad({
        nombre: formData.nombre,
        tipo: formData.tipo,
        modalidad: formData.modalidad,
        identificador: formData.identificador,
        contactoNombre: formData.contactoNombre,
        contactoEmail: formData.contactoEmail,
        contactoTelefono: formData.contactoTelefono,
        bolsaHorasInicial:
          formData.modalidad === 'bolsa' && formData.bolsaHorasInicial !== ''
            ? Number(formData.bolsaHorasInicial)
            : 0,
        dominioCorporativo:
          formData.modalidad === 'bolsa' ? formData.dominioCorporativo.trim() : undefined
      });
      toast.success('Convenio creado exitosamente');
      setShowModal(false);
      setFormData({
        nombre: '',
        tipo: 'empresa',
        modalidad: 'descuento',
        identificador: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        bolsaHorasInicial: '',
        dominioCorporativo: ''
      });
      cargarEntidades();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al crear convenio');
    }
  };

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

  const abrirModalHoras = (entidad: Entidad, e: React.MouseEvent) => {
    e.stopPropagation();
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
      reporte: null,
      cupones: [],
      cargandoCupones: false,
      usuarios: [],
      cargandoUsuarios: false
    });

    if (entidad.modalidad === 'bolsa') {
      cargarReporte(entidad.id, formatFecha(primerDia), formatFecha(ultimoDia));
    } else {
      cargarCupones(entidad.id);
    }
    cargarUsuariosVinculados(entidad.id);
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

  const cargarCupones = async (entidadId: string) => {
    try {
      setModalDetalle((m) => ({ ...m, cargandoCupones: true, cupones: [] }));
      const data = await cobrosService.obtenerCuponesDeEntidad(entidadId);
      setModalDetalle((m) => ({ ...m, cargandoCupones: false, cupones: data }));
    } catch (err) {
      toast.error('Error al cargar cupones');
      console.error(err);
      setModalDetalle((m) => ({ ...m, cargandoCupones: false }));
    }
  };

  const cargarUsuariosVinculados = async (entidadId: string) => {
    try {
      setModalDetalle((m) => ({ ...m, cargandoUsuarios: true, usuarios: [] }));
      const data = await cobrosService.obtenerResumenEntidad(entidadId);
      setModalDetalle((m) => ({ ...m, cargandoUsuarios: false, usuarios: data.usuarios || [] }));
    } catch (err) {
      console.error('Error al cargar usuarios vinculados:', err);
      setModalDetalle((m) => ({ ...m, cargandoUsuarios: false }));
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

  const abrirModalCupon = () => {
    if (!modalDetalle.entidad) return;
    setModalCupon({
      abierto: true,
      entidad: modalDetalle.entidad,
      codigo: '',
      valor: '',
      usosMaximos: '',
      fechaExpiracion: ''
    });
  };

  const handleGenerarCupon = async () => {
    if (!modalCupon.entidad) return;
    if (!modalCupon.valor || Number(modalCupon.valor) <= 0) {
      toast.error('El valor del descuento debe ser mayor a 0');
      return;
    }
    if (Number(modalCupon.valor) > 100) {
      toast.error('El descuento no puede superar el 100%');
      return;
    }

    try {
      const res = await cobrosService.generarCuponParaEntidad(modalCupon.entidad.id, {
        valor: Number(modalCupon.valor),
        codigo: modalCupon.codigo.trim() || undefined,
        usosMaximos: modalCupon.usosMaximos !== '' ? Number(modalCupon.usosMaximos) : undefined,
        fechaExpiracion: modalCupon.fechaExpiracion || undefined
      });
      toast.success(`Cupón generado: ${res.data.codigo}`);
      setModalCupon({ abierto: false, entidad: null, codigo: '', valor: '', usosMaximos: '', fechaExpiracion: '' });
      if (modalDetalle.entidad) {
        cargarCupones(modalDetalle.entidad.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al generar cupón');
      console.error(err);
    }
  };

  // ============================================
  // ASIGNAR USUARIOS
  // ============================================
  const abrirModalAsignar = () => {
    if (!modalDetalle.entidad) return;
    setModalAsignar({ abierto: true, entidad: modalDetalle.entidad, email: '' });
  };

  const handleAsignarUsuario = async () => {
    if (!modalAsignar.entidad) return;
    if (!modalAsignar.email.trim()) {
      toast.error('Ingresa un email');
      return;
    }
    try {
      await cobrosService.asignarUsuarioAEntidadPorEmail(
        modalAsignar.entidad.id,
        modalAsignar.email.trim()
      );
      toast.success('Usuario vinculado al convenio');
      setModalAsignar({ abierto: false, entidad: null, email: '' });
      if (modalDetalle.entidad) {
        cargarUsuariosVinculados(modalDetalle.entidad.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al vincular usuario', { duration: 6000 });
    }
  };

  const abrirModalMasivo = () => {
    if (!modalDetalle.entidad) return;
    setModalMasivo({
      abierto: true,
      entidad: modalDetalle.entidad,
      texto: '',
      procesando: false,
      resultados: null
    });
  };

  
  const handleCargaMasiva = async () => {
    if (!modalMasivo.entidad) return;
    const texto = modalMasivo.texto.trim();
    if (!texto) {
      toast.error('Pega o carga los emails');
      return;
    }

    const emails = texto
      .split(/[\n,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error('No se encontraron emails válidos');
      return;
    }

    setModalMasivo((m) => ({ ...m, procesando: true, resultados: null }));
    try {
      const res = await cobrosService.asignarUsuariosMasivo(modalMasivo.entidad.id, emails);
      setModalMasivo((m) => ({
        ...m,
        procesando: false,
        resultados: res.data.resultados || []
      }));

      const stats = res.data;
      toast.success(
        `Vinculados: ${stats.vinculados} · Pendientes de registro: ${stats.pendientes} · Con problemas: ${stats.fallidos}`,
        { duration: 8000 }
      );

      if (modalDetalle.entidad) {
        cargarUsuariosVinculados(modalDetalle.entidad.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error en la carga masiva');
      setModalMasivo((m) => ({ ...m, procesando: false }));
    }
  };

  const handleArchivoCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = String(event.target?.result || '');
      setModalMasivo((m) => ({ ...m, texto: contenido }));
    };
    reader.onerror = () => toast.error('Error al leer el archivo');
    reader.readAsText(file);
    e.target.value = '';
  };

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
                  Modalidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas
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
                  <td className="px-4 py-3 text-sm">
                    {entidad.modalidad === 'bolsa' ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Bolsa de horas
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Descuento
                      </span>
                    )}
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
                    {entidad.modalidad === 'bolsa' ? (
                      <>
                        <span className="font-semibold text-green-700">
                          {entidad.bolsa_horas_restantes}
                        </span>
                        <span className="text-gray-400 text-xs"> / {entidad.bolsa_horas_inicial}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entidad.modalidad === 'bolsa' ? (
                      <button
                        onClick={(e) => abrirModalHoras(entidad, e)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-xs whitespace-nowrap"
                      >
                        + Horas
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
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
                    Modalidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-primario"
                    value={formData.modalidad}
                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value as any })}
                  >
                    <option value="descuento">Descuento (cupón por sesión)</option>
                    <option value="bolsa">Bolsa de horas</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.modalidad === 'descuento'
                      ? 'Los usuarios ingresan un cupón al agendar y se les aplica el % de descuento.'
                      : 'Los usuarios canjean un código una vez y sus sesiones consumen de la bolsa.'}
                  </p>
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

                {formData.modalidad === 'bolsa' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dominio corporativo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: biozynex.com"
                        className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                        value={formData.dominioCorporativo}
                        onChange={(e) =>
                          setFormData({ ...formData, dominioCorporativo: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Solo los correos con este dominio podrán canjear el código de bolsa.
                      </p>
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
                  </>
                )}
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
                  Modalidad: {modalDetalle.entidad.modalidad === 'bolsa' ? 'Bolsa de horas' : 'Descuento'}
                  {modalDetalle.entidad.modalidad === 'bolsa' && (
                    <>
                      {' · '}
                      Bolsa: {modalDetalle.entidad.bolsa_horas_restantes} / {modalDetalle.entidad.bolsa_horas_inicial} h
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setModalDetalle({
                  abierto: false, entidad: null, desde: '', hasta: '', cargando: false,
                  reporte: null, cupones: [], cargandoCupones: false, usuarios: [], cargandoUsuarios: false
                })}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {modalDetalle.entidad.modalidad === 'bolsa' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <p className="text-sm text-gray-600">
                    Los usuarios deben ingresar un cupón al agendar. Cada cupón es de un solo uso por usuario.
                  </p>
                  <button
                    onClick={abrirModalCupon}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    + Generar cupón
                  </button>
                </div>

                {modalDetalle.cargandoCupones && (
                  <div className="text-center py-8 text-gray-500">Cargando cupones...</div>
                )}

                {!modalDetalle.cargandoCupones && modalDetalle.cupones.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No hay cupones generados todavía. Haz click en "+ Generar cupón" para crear el primero.
                  </div>
                )}

                {!modalDetalle.cargandoCupones && modalDetalle.cupones.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Código</th>
                          <th className="px-3 py-2 text-right">Descuento</th>
                          <th className="px-3 py-2 text-right">Usos</th>
                          <th className="px-3 py-2 text-left">Expira</th>
                          <th className="px-3 py-2 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {modalDetalle.cupones.map((c) => (
                          <tr key={c.id}>
                            <td className="px-3 py-2 font-mono font-semibold text-gray-800">
                              {c.codigo}
                            </td>
                            <td className="px-3 py-2 text-right">{c.valor}%</td>
                            <td className="px-3 py-2 text-right">
                              {c.usos_actuales} / {c.usos_maximos}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {c.fecha_expiracion
                                ? new Date(c.fecha_expiracion).toLocaleDateString('es-CO', {
                                    timeZone: 'America/Bogota'
                                  })
                                : 'Sin expiración'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {c.activo ? (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  Inactivo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* === USUARIOS VINCULADOS === */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <h4 className="font-semibold text-gray-800">
                  Usuarios vinculados ({modalDetalle.usuarios.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={abrirModalAsignar}
                    className="bg-primario text-white px-3 py-1.5 rounded-lg hover:bg-primario-dark text-sm whitespace-nowrap"
                  >
                    + Asignar usuario
                  </button>
                  <button
                    onClick={abrirModalMasivo}
                    className="bg-[#3D405B] text-white px-3 py-1.5 rounded-lg hover:bg-[#2D2F44] text-sm whitespace-nowrap"
                  >
                    📄 Carga masiva
                  </button>
                </div>
              </div>

              {modalDetalle.cargandoUsuarios && (
                <p className="text-center text-gray-500 py-4">Cargando usuarios...</p>
              )}

              {!modalDetalle.cargandoUsuarios && modalDetalle.usuarios.length === 0 && (
                <p className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">
                  Aún no hay usuarios vinculados a este convenio.
                </p>
              )}

              {!modalDetalle.cargandoUsuarios && modalDetalle.usuarios.length > 0 && (
                <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Correo</th>
                        <th className="px-3 py-2 text-center">Exento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modalDetalle.usuarios.map((u: any) => (
                        <tr key={u.id}>
                          <td className="px-3 py-2">{u.nombre || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{u.email}</td>
                          <td className="px-3 py-2 text-center">
                            {u.es_exento ? '✅' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal generar cupón */}
      {modalCupon.abierto && modalCupon.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-primario">Generar cupón</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convenio: <span className="font-medium">{modalCupon.entidad.nombre}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código personalizado (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: BIOZYNEX2026 (vacío = automático)"
                  className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario uppercase"
                  value={modalCupon.codigo}
                  onChange={(e) =>
                    setModalCupon({
                      ...modalCupon,
                      codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                    })
                  }
                  maxLength={40}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras, números y guiones. Entre 4 y 40 caracteres. Si lo dejas vacío, el sistema genera uno.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ej: 20"
                  className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                  value={modalCupon.valor}
                  onChange={(e) =>
                    setModalCupon({
                      ...modalCupon,
                      valor: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usos máximos
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 100 (dejar vacío = 100)"
                  className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario"
                  value={modalCupon.usosMaximos}
                  onChange={(e) =>
                    setModalCupon({
                      ...modalCupon,
                      usosMaximos: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cuántos usuarios distintos pueden usar este cupón (cada uno una sola vez).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de expiración (opcional)
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-primario"
                  value={modalCupon.fechaExpiracion}
                  onChange={(e) =>
                    setModalCupon({ ...modalCupon, fechaExpiracion: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleGenerarCupon}
                disabled={!modalCupon.valor || Number(modalCupon.valor) <= 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generar
              </button>
              <button
                type="button"
                onClick={() => setModalCupon({ abierto: false, entidad: null, codigo: '', valor: '', usosMaximos: '', fechaExpiracion: '' })}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar usuario individual */}
      {modalAsignar.abierto && modalAsignar.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-primario">Asignar usuario</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convenio: <span className="font-medium">{modalAsignar.entidad.nombre}</span>
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Ej: usuario@empresa.com"
              className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario mb-4"
              value={modalAsignar.email}
              onChange={(e) => setModalAsignar({ ...modalAsignar, email: e.target.value })}
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={handleAsignarUsuario}
                disabled={!modalAsignar.email.trim()}
                className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vincular
              </button>
              <button
                type="button"
                onClick={() => setModalAsignar({ abierto: false, entidad: null, email: '' })}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal carga masiva */}
      {modalMasivo.abierto && modalMasivo.entidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 text-primario">Carga masiva de usuarios</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convenio: <span className="font-medium">{modalMasivo.entidad.nombre}</span>
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subir archivo CSV o TXT
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              className="w-full text-sm mb-4 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primario file:text-white file:cursor-pointer hover:file:bg-primario-dark"
              onChange={handleArchivoCSV}
            />
            <p className="text-xs text-gray-500 -mt-3 mb-4">
              El archivo debe tener un email por línea (o separados por comas). Ignora encabezados.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              O pega los emails aquí (uno por línea)
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primario mb-4 font-mono text-sm"
              rows={8}
              placeholder={'usuario1@empresa.com\nusuario2@empresa.com\nusuario3@empresa.com'}
              value={modalMasivo.texto}
              onChange={(e) => setModalMasivo({ ...modalMasivo, texto: e.target.value })}
              disabled={modalMasivo.procesando}
            />

            {modalMasivo.resultados && (
              <div className="mb-4 max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Email</th>
                      <th className="px-2 py-1 text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {modalMasivo.resultados.map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 font-mono">{r.email}</td>
                        <td className="px-2 py-1 text-center">
                          {r.ok && r.tipo === 'vinculado' && (
                            <span className="text-green-700">✅ Vinculado (ya existía)</span>
                          )}
                          {r.ok && r.tipo === 'pendiente' && (
                            <span className="text-amber-700">⏳ Pendiente (se vinculará al registrarse)</span>
                          )}
                          {!r.ok && (
                            <span className="text-red-700" title={r.mensaje}>
                              ❌ {r.mensaje || r.motivo}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCargaMasiva}
                disabled={modalMasivo.procesando || !modalMasivo.texto.trim()}
                className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalMasivo.procesando ? 'Procesando...' : 'Vincular usuarios'}
              </button>
              <button
                type="button"
                onClick={() => setModalMasivo({ abierto: false, entidad: null, texto: '', procesando: false, resultados: null })}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
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