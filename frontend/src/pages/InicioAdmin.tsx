import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { perfilService } from '../services/turnosService';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

interface Alertas {
  nuevosUsuarios: number;
  reprogramaciones: number;
  cobrosPendientes: number;
  cancelaciones: number;
}

interface KPIs {
  turnosHoy: number;
  recaudadoHoy: number;
  donacionesHoy: number;
  usuariosNuevos: number;
}

const InicioAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [miFoto, setMiFoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<Alertas>({
    nuevosUsuarios: 0,
    reprogramaciones: 0,
    cobrosPendientes: 0,
    cancelaciones: 0
  });
  const [kpis, setKpis] = useState<KPIs>({
    turnosHoy: 0,
    recaudadoHoy: 0,
    donacionesHoy: 0,
    usuariosNuevos: 0
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Foto de perfil
        const perfil = await perfilService.getMiPerfil();
        setMiFoto(perfil?.foto_perfil || null);

        // Cargar todos los datos en paralelo
        const [
          repRes,
          cobrosRes,
          donacionesRes,
          cancelacionesRes,
          nuevosUsuariosRes,
          turnosHoyRes
        ] = await Promise.allSettled([
          axios.get(`${API_URL}/admin/reprogramaciones/pendientes/count`, { headers }),
          axios.get(`${API_URL}/cobros/historial?estado=pendiente`, { headers }),
          axios.get(`${API_URL}/donaciones/admin/estadisticas`, { headers }),
          axios.get(`${API_URL}/turnos/cancelaciones/no-vistas/count`, { headers }),
          axios.get(`${API_URL}/admin/turnos-pendientes-asignacion`, { headers }),
          axios.get(`${API_URL}/admin/turnos-hoy/count`, { headers })
        ]);

        // Reprogramaciones
        let reprogramaciones = 0;
        if (repRes.status === 'fulfilled') {
          reprogramaciones = repRes.value.data.count || 0;
        }

        // Cobros pendientes
        let cobrosPendientes = 0;
        if (cobrosRes.status === 'fulfilled') {
          cobrosPendientes = cobrosRes.value.data.data?.length || 0;
        }

        // Donaciones + recaudado
        let donacionesHoy = 0;
        let recaudadoHoy = 0;
        if (donacionesRes.status === 'fulfilled') {
          const d = donacionesRes.value.data.data;
          donacionesHoy = parseInt(d?.completadas || '0');
          recaudadoHoy = parseFloat(d?.total_recaudado || '0');
        }

        // Cancelaciones
        let cancelaciones = 0;
        if (cancelacionesRes.status === 'fulfilled') {
          cancelaciones = cancelacionesRes.value.data.count || 0;
        }

        // Nuevos usuarios (turnos pendientes de asignación)
        let nuevosUsuarios = 0;
        if (nuevosUsuariosRes.status === 'fulfilled') {
          nuevosUsuarios = nuevosUsuariosRes.value.data?.length || 0;
        }

        // Turnos de hoy
        let turnosHoy = 0;
        if (turnosHoyRes.status === 'fulfilled') {
          turnosHoy = turnosHoyRes.value.data.count || 0;
        }

        setAlertas({
          nuevosUsuarios,
          reprogramaciones,
          cobrosPendientes,
          cancelaciones
        });

        setKpis({
          turnosHoy,
          recaudadoHoy,
          donacionesHoy,
          usuariosNuevos: nuevosUsuarios
        });
      } catch (error) {
        console.error('Error al cargar inicio admin:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!user || user.rol !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-br from-[#3D405B]/10 to-[#81B29A]/20 rounded-3xl p-6 md:p-8 mb-8">
        <div className="flex items-center gap-4 md:gap-5">
          <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
          <div>
            <h1 className="text-2xl md:text-4xl font-serif text-[#3D405B]">
              Panel de Administración
            </h1>
            <p className="text-[#5D6078] mt-1 md:mt-2 text-base md:text-lg">
              Bienvenido, {user.nombre || 'Administrador'}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas importantes */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">🔔 Requiere tu atención</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className={`rounded-2xl p-5 text-left shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${
            alertas.reprogramaciones > 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔄</span>
            {alertas.reprogramaciones > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {alertas.reprogramaciones}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">Reprogramaciones</p>
          <p className="text-2xl font-bold text-[#3D405B]">{alertas.reprogramaciones}</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className={`rounded-2xl p-5 text-left shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${
            alertas.cobrosPendientes > 0
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💳</span>
            {alertas.cobrosPendientes > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {alertas.cobrosPendientes}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">Cobros pendientes</p>
          <p className="text-2xl font-bold text-[#3D405B]">{alertas.cobrosPendientes}</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Nuevos usuarios</p>
          <p className="text-2xl font-bold text-[#3D405B]">{alertas.nuevosUsuarios}</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✗</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Cancelaciones</p>
          <p className="text-2xl font-bold text-[#3D405B]">{alertas.cancelaciones}</p>
        </button>
      </div>

      {/* KPIs del día */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">📊 Resumen del día</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-medium text-gray-500">Turnos hoy</p>
          </div>
          <p className="text-3xl font-bold text-[#3D405B]">{kpis.turnosHoy}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <p className="text-sm font-medium text-gray-500">Recaudado</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(kpis.recaudadoHoy)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💝</span>
            <p className="text-sm font-medium text-gray-500">Donaciones</p>
          </div>
          <p className="text-3xl font-bold text-[#E07A5F]">{kpis.donacionesHoy}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✨</span>
            <p className="text-sm font-medium text-gray-500">Usuarios nuevos</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{kpis.usuariosNuevos}</p>
        </div>
      </div>

      {/* Acceso rápido */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">⚡ Acceso rápido</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">👥</div>
          <p className="text-sm font-medium text-[#3D405B]">Usuarios</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">👤</div>
          <p className="text-sm font-medium text-[#3D405B]">Nuevos</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">🔄</div>
          <p className="text-sm font-medium text-[#3D405B]">Reprogramar</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">💵</div>
          <p className="text-sm font-medium text-[#3D405B]">Cobros</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">💝</div>
          <p className="text-sm font-medium text-[#3D405B]">Donaciones</p>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm font-medium text-[#3D405B]">Estadísticas</p>
        </button>
      </div>
    </Layout>
  );
};

export default InicioAdmin;