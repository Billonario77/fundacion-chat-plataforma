import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usuarioService, Turno } from '../services/turnosService';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';

const InicioUsuario: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Turno[]>([]);
  const [miFoto, setMiFoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [data, perfil] = await Promise.all([
          usuarioService.getMisSolicitudes(),
          usuarioService.getMiPerfil()
        ]);
        setSolicitudes(data.turnos);
        setMiFoto(perfil?.foto_perfil || null);
      } catch (error) {
        console.error('Error al cargar inicio:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Saludo según hora
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Frases inspiradoras (rota según el día)
  const frases = [
    'No estás solo. A veces, el primer paso es simplemente hablar.',
    'Hoy es un buen día para cuidar de ti.',
    'Cada paso, por pequeño que sea, cuenta.',
    'Mereces sentir paz.',
    'Estamos aquí para escucharte, sin juicios.'
  ];
  const fraseDelDia = frases[new Date().getDate() % frases.length];

  // Próximo turno
  const turnosActivos = solicitudes.filter(s => 
    ['pendiente_admin', 'pendiente_pago', 'pendiente', 'aceptado', 'iniciado'].includes(s.estado)
  );
  const proximoTurno = turnosActivos
    .filter(s => new Date(s.fecha_programada) > new Date())
    .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())[0];

  // Pago pendiente
  const pagoPendiente = turnosActivos.find(s => s.estado === 'pendiente_pago');

  // Guía asignado (último turno con guía)
  const ultimoTurnoConGuia = solicitudes
    .filter(s => s.guia_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const guiaAsignado = ultimoTurnoConGuia?.guia_nombre || null;

  // Últimas 3 sesiones completadas o canceladas
  const ultimasSesiones = solicitudes
    .filter(s => s.estado === 'completado' || s.estado === 'cancelado')
    .sort((a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime())
    .slice(0, 3);

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  if (!user || user.rol !== 'usuario') {
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
      <div className="bg-gradient-to-br from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="flex items-center gap-4 md:gap-5 relative z-10">
          <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
          <div>
            <h1 className="text-2xl md:text-4xl font-serif text-[#3D405B]">
              {saludo}, {user.nombre?.split(' ')[0]} 💛
            </h1>
            <p className="text-[#5D6078] mt-1 md:mt-2 text-base md:text-lg">
              ¿Cómo te sientes hoy? Estamos aquí para escucharte.
            </p>
          </div>
        </div>
      </div>

      {/* Estado / Alertas */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Próxima sesión */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-medium text-gray-500">Próxima sesión</p>
          </div>
          {proximoTurno ? (
            <>
              <p className="font-semibold text-[#3D405B]">{formatFecha(proximoTurno.fecha_programada)}</p>
              <p className="text-sm text-gray-500 mt-1">Con {proximoTurno.guia_nombre || 'por asignar'}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No tienes sesiones próximas</p>
          )}
        </div>

        {/* Mi guía */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🧑‍🏫</span>
            <p className="text-sm font-medium text-gray-500">Mi guía</p>
          </div>
          {guiaAsignado ? (
            <p className="font-semibold text-[#3D405B]">{guiaAsignado}</p>
          ) : (
            <p className="text-sm text-gray-500">Se asignará en tu primera sesión</p>
          )}
        </div>

        {/* Pagos */}
        <div className={`rounded-2xl p-5 shadow-sm border ${
          pagoPendiente ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💳</span>
            <p className="text-sm font-medium text-gray-500">Pagos</p>
          </div>
          {pagoPendiente ? (
            <>
              <p className="font-semibold text-red-700">Tienes un pago pendiente</p>
              <button
                onClick={() => navigate(`/turnos/${pagoPendiente.id}`)}
                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
              >
                Ir a pagar →
              </button>
            </>
          ) : (
            <p className="text-sm text-green-600">Sin pagos pendientes</p>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <h2 className="text-xl font-semibold text-[#3D405B] mb-4">¿Qué quieres hacer hoy?</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => navigate('/usuario', { state: { pestañaInicial: 'activas', abrirFormulario: true } })}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">🗓️</div>
          <p className="font-medium text-[#3D405B]">Agendar sesión</p>
        </button>

        <button
          onClick={() => navigate('/usuario', { state: { pestañaInicial: 'activas' } })}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">💬</div>
          <p className="font-medium text-[#3D405B]">Mis turnos</p>
        </button>

        <button
          onClick={() => navigate('/usuario', { state: { pestañaInicial: 'historial' } })}
          className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-2">📚</div>
          <p className="font-medium text-[#3D405B]">Historial</p>
        </button>

        {/* BOTÓN DE DONAR - siempre visible */}
        <button
          onClick={() => navigate('/donar')}
          className="bg-gradient-to-br from-[#F2CC8F] to-[#E07A5F] rounded-2xl p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-white"
        >
          <div className="text-4xl mb-2">💝</div>
          <p className="font-medium">Donar</p>
        </button>
      </div>

      {/* Frase inspiradora del día */}
      <div className="bg-gradient-to-br from-[#FDF6EC] to-[#F4E8D8] rounded-3xl p-6 md:p-8 mb-8 text-center border border-[#F2CC8F]/40">
        <p className="text-lg md:text-2xl font-serif text-[#3D405B] italic leading-relaxed">
          "{fraseDelDia}"
        </p>
      </div>

      {/* Últimas sesiones */}
      {ultimasSesiones.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-[#3D405B] mb-4">Sesiones recientes</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {ultimasSesiones.map((sesion, idx) => (
              <div
                key={sesion.id}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                  idx !== ultimasSesiones.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => navigate(`/turnos/${sesion.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    sesion.estado === 'completado' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-[#3D405B]">
                      {sesion.guia_nombre || 'Guía'}
                    </p>
                    <p className="text-sm text-gray-500">{formatFecha(sesion.fecha_programada)}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  sesion.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {sesion.estado === 'completado' ? 'Completada' : 'Cancelada'}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/usuario', { state: { pestañaInicial: 'historial' } })}
              className="text-[#E07A5F] hover:text-[#d16a4f] font-medium text-sm"
            >
              Ver todo el historial →
            </button>
          </div>
        </>
      )}
    </Layout>
  );
};

export default InicioUsuario;