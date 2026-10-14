import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { suscripcionesService } from '../../services/suscripcionesService';

interface SuscripcionAdmin {
  id: string;
  usuario_id: string;
  plan: 'bienestar' | 'refugio' | 'santuario';
  sesiones_incluidas: number;
  sesiones_usadas: number;
  precio_pagado: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activa' | 'vencida' | 'cancelada';
  estado_pago: 'pendiente' | 'pagado' | 'fallido';
  pagado_at: string | null;
  created_at: string;
  usuario_nombre: string;
  usuario_email: string;
}

interface Metricas {
  activas: number;
  porPlan: { bienestar: number; refugio: number; santuario: number };
  facturadoMes: number;
  cantidadPagadaMes: number;
}

const NOMBRES_PLAN: Record<string, string> = {
  bienestar: '💎 Bienestar',
  refugio: '🌟 Refugio',
  santuario: '👑 Santuario',
};

const GestionSuscripciones: React.FC = () => {
  const [suscripciones, setSuscripciones] = useState<SuscripcionAdmin[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEmail, setFiltroEmail] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    cargarMetricas();
  }, []);

  useEffect(() => {
    cargarSuscripciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, filtroPlan, filtroEstado]);

  const cargarMetricas = async () => {
    try {
      const data = await suscripcionesService.metricasAdmin();
      setMetricas(data);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
    }
  };

  const cargarSuscripciones = async () => {
    setLoading(true);
    try {
      const res = await suscripcionesService.listarAdmin({
        email: filtroEmail.trim() || undefined,
        plan: filtroPlan || undefined,
        estado: filtroEstado || undefined,
        page: pagina,
        limit: 20,
      });
      setSuscripciones(res.data);
      setTotalPaginas(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch (err) {
      toast.error('Error al cargar suscripciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargarSuscripciones();
  };

  const handleLimpiar = () => {
    setFiltroEmail('');
    setFiltroPlan('');
    setFiltroEstado('');
    setPagina(1);
    setTimeout(() => cargarSuscripciones(), 0);
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Bogota',
    });
  };

  const formatMoneda = (v: string | number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(typeof v === 'string' ? parseFloat(v) : v);

  const colorEstado = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-primario mb-2">
        Suscripciones
      </h2>
      <p className="text-sm md:text-base text-gray-600 mb-6">
        Gestiona y consulta todas las suscripciones de los usuarios.
      </p>

      {/* Métricas */}
      {metricas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-2xl p-4 border border-[#F2CC8F]/50">
            <p className="text-xs text-gray-600">Suscripciones activas</p>
            <p className="text-2xl font-bold text-[#3D405B] mt-1">
              {metricas.activas}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F2CC8F]/40">
            <p className="text-xs text-gray-600">💎 Bienestar</p>
            <p className="text-2xl font-bold text-[#3D405B] mt-1">
              {metricas.porPlan.bienestar}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F2CC8F]/40">
            <p className="text-xs text-gray-600">🌟 Refugio</p>
            <p className="text-2xl font-bold text-[#3D405B] mt-1">
              {metricas.porPlan.refugio}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F2CC8F]/40">
            <p className="text-xs text-gray-600">👑 Santuario</p>
            <p className="text-2xl font-bold text-[#3D405B] mt-1">
              {metricas.porPlan.santuario}
            </p>
          </div>
        </div>
      )}

      {metricas && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-green-800">
            💰 <strong>Facturado este mes:</strong> {formatMoneda(metricas.facturadoMes)}
            <span className="text-xs text-green-700 ml-2">
              ({metricas.cantidadPagadaMes} pago{metricas.cantidadPagadaMes === 1 ? '' : 's'})
            </span>
          </p>
        </div>
      )}

      {/* Filtros */}
      <form onSubmit={handleBuscar} className="bg-gray-50 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por email…"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primario"
            value={filtroEmail}
            onChange={(e) => setFiltroEmail(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primario"
            value={filtroPlan}
            onChange={(e) => { setFiltroPlan(e.target.value); setPagina(1); }}
          >
            <option value="">Todos los planes</option>
            <option value="bienestar">💎 Bienestar</option>
            <option value="refugio">🌟 Refugio</option>
            <option value="santuario">👑 Santuario</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primario"
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-primario text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primario-dark"
            >
              🔍 Buscar
            </button>
            <button
              type="button"
              onClick={handleLimpiar}
              className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando suscripciones…</div>
      ) : suscripciones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay suscripciones que coincidan con los filtros.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Sesiones</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Vigencia</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suscripciones.map((s) => {
                    const restantes = s.sesiones_incluidas - s.sesiones_usadas;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#3D405B]">{s.usuario_nombre}</p>
                          <p className="text-xs text-gray-500">{s.usuario_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{NOMBRES_PLAN[s.plan]}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-[#3D405B]">{restantes}</span>
                          <span className="text-xs text-gray-500"> / {s.sesiones_incluidas}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {formatFecha(s.fecha_inicio)}
                          <br />
                          <span className="text-gray-400">→ {formatFecha(s.fecha_fin)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorEstado(s.estado)}`}>
                            {s.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-[#3D405B]">
                            {formatMoneda(s.precio_pagado)}
                          </span>
                          <p className="text-xs text-gray-500">{formatFecha(s.pagado_at)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                <span className="text-gray-400"> · {totalItems} total</span>
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GestionSuscripciones;