import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { turnosService, Turno, perfilService } from '../services/turnosService';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

const InicioGuia: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [miFoto, setMiFoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [miCarga, setMiCarga] = useState({
    activos: 0,
    pendientes: 0,
    enCurso: 0,
    totales: 0,
    proximas24h: 0
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [data, perfil] = await Promise.all([
          turnosService.getMisTurnos(),
          perfilService.getMiPerfil()
        ]);
        setTurnos(data.turnos);
        setMiFoto(perfil?.foto_perfil || null);

        // Cargar carga del guía
        const token = localStorage.getItem('token');
        const cargaRes = await axios.get(`${API_URL}/admin/mi-carga-guia`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMiCarga({
          activos: cargaRes.data.turnos_activos || 0,
          pendientes: cargaRes.data.turnos_pendientes || 0,
          enCurso: cargaRes.data.turnos_en_curso || 0,
          totales: cargaRes.data.turnos_totales || 0,
          proximas24h: cargaRes.data.turnos_proximas_24h || 0
        });
      } catch (error) {
        console.error('Error al cargar inicio guía:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Saludo según hora
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Turnos activos
  const turnosActivos = turnos.filter(t => 
    ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)
  );

  // Sesiones de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const sesionesHoy = turnosActivos.filter(t => 
    t.fecha_programada.split('T')[0] === hoy
  ).sort((a, b) => 
    new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
  );

  // Frases motivacionales
  const frases = [
    'Tu presencia hace la diferencia en la vida de alguien hoy.',
    'Escuchar es el regalo más grande que puedes ofrecer.',
    'Cada sesión es una oportunidad para transformar una vida.',
    'Tu labor siembra esperanza.',
    'Gracias por estar aquí para los demás.'
  ];
  const fraseDelDia = frases[new Date().getDate() % frases.length];

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  if (!user || user.rol !== 'guia') {
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
      <div className="bg-gradient-to-br from-[#81B29A]/30 to-[#F2CC8F]/30 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="flex items-center gap-4 md:gap-5 relative z-10">
          <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
          <div>
            <h1 className="text-2xl md:text-4xl font-serif text-[#3D405B]">
              {saludo}, {user.nombre?.split(' ')[0]} ☀️
            </h1>
            <p className="text-[#5D6078] mt-1 md:mt-2 text-base md:text-lg">
              {sesionesHoy.length > 0 
                ? `Tienes ${sesionesHoy.length} ${sesionesHoy.length === 1 ? 'sesión' : 'sesiones'} programadas para hoy`
                : 'No tienes sesiones programadas para hoy'}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👥</span>
            <p className="text-sm font-medium text-gray-500">Pacientes activos</p>
          </div>
          <p className="text-3xl font-bold text-[#3D405B]">{miCarga.activos}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏳</span>
            <p className="text-sm font-medium text-gray-500">Pendientes</p>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{miCarga.pendientes}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔄</span>
            <p className="text-sm font-medium text-gray-500">En curso</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{miCarga.enCurso}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-medium text-gray-500">Próximas 24h</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{miCarga.proximas24h}</p>
        </div>
      </div>

      {/* Agenda de hoy */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">Agenda de hoy</h2>
      {sesionesHoy.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 mb-8">
          <p className="text-gray-500">No tienes sesiones programadas para hoy</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {sesionesHoy.map((sesion, idx) => (
            <div
              key={sesion.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                idx !== sesionesHoy.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onClick={() => navigate(`/turnos/${sesion.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#3D405B]">
                    {formatHora(sesion.fecha_programada)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[#3D405B]">
                    {sesion.usuario_nombre || 'Usuario'}
                  </p>
                  <p className="text-sm text-gray-500">{sesion.usuario_email}</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${
                sesion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                sesion.estado === 'aceptado' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {sesion.estado === 'pendiente' ? '⏳ Pendiente' :
                 sesion.estado === 'aceptado' ? '✅ Aceptado' :
                 '🔄 En curso'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones rápidas */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/guia')}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">📋</div>
          <p className="font-medium text-[#3D405B]">Mis turnos</p>
        </button>

        <button
          onClick={() => navigate('/guia')}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">📊</div>
          <p className="font-medium text-[#3D405B]">Mi carga</p>
        </button>

        <button
          onClick={() => navigate('/guia')}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">📚</div>
          <p className="font-medium text-[#3D405B]">Historial</p>
        </button>
      </div>

      {/* Frase motivacional */}
      <div className="bg-gradient-to-br from-[#FDF6EC] to-[#F4E8D8] rounded-3xl p-6 md:p-8 text-center border border-[#81B29A]/40">
        <p className="text-lg md:text-2xl font-serif text-[#3D405B] italic leading-relaxed">
          "{fraseDelDia}"
        </p>
      </div>
    </Layout>
  );
};

export default InicioGuia;