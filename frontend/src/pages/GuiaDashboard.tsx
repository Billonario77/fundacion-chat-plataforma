import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMensajesNoLeidos } from '../contexts/MensajesNoLeidosContext';
import toast from 'react-hot-toast';
import { turnosService, Turno, perfilService } from '../services/turnosService';
import HistorialTurnos from '../components/HistorialTurnos';
import Layout from '../components/Layout';
import ModalCancelarTurno from '../components/ModalCancelarTurno';
import Avatar from '../components/Avatar';
import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

const GuiaDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { noLeidos, recargarNoLeidos } = useMensajesNoLeidos();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pestañaActiva, setPestañaActiva] = useState<'activos' | 'cancelados' | 'historial'>('activos');
  const [ultimoEvento, setUltimoEvento] = useState('');
  const [modalCancelar, setModalCancelar] = useState<{ 
    abierto: boolean; 
    turnoId: string | null 
  }>({
    abierto: false,
    turnoId: null
  });
  
  const [nuevasCancelacionesCount, setNuevasCancelacionesCount] = useState(0);
  const [miFoto, setMiFoto] = useState<string | null>(null);

  const [miCarga, setMiCarga] = useState<{ 
    activos: number; 
    pendientes: number; 
    enCurso: number;
    totales: number;
    proximas24h: number;
  }>({
    activos: 0,
    pendientes: 0,
    enCurso: 0,
    totales: 0,
    proximas24h: 0
  });

  const turnosCanceladosPorMi = turnos.filter((t: Turno) => 
    t.estado === 'cancelado' && t.cancelado_por === 'guia'
  );

  useEffect(() => {
    if (pestañaActiva === 'activos' || pestañaActiva === 'cancelados') {
      cargarTurnos();
    }
  }, [pestañaActiva]);

  const cargarMiCarga = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/mi-carga`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMiCarga({
        activos: response.data.turnos_activos || 0,
        pendientes: response.data.turnos_pendientes || 0,
        enCurso: response.data.turnos_en_curso || 0,
        totales: response.data.turnos_totales || 0,
        proximas24h: response.data.turnos_proximas_24h || 0
      });
    } catch (error) {
      console.error('Error al cargar mi carga:', error);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/carga-guias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const guias = response.data.guias;
        const miGuia = guias.find((g: any) => g.id === user?.id);
        
        if (miGuia) {
          setMiCarga({
            activos: miGuia.turnos_activos || 0,
            pendientes: miGuia.turnos_pendientes || 0,
            enCurso: miGuia.turnos_en_curso || 0,
            totales: miGuia.turnos_totales || 0,
            proximas24h: miGuia.turnos_proximas_24h || 0
          });
        }
      } catch (err2) {
        console.error('Error al cargar carga desde endpoint alternativo:', err2);
      }
    }
  };

  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Guía escuchando notificaciones...');

    socket.off('nuevo-turno-disponible');
    socket.off('nuevo-mensaje');

    socket.on('nuevo-turno-disponible', (data) => {
      console.log('📨 Nueva solicitud recibida:', data);
      cargarTurnos();
      cargarMiCarga();
      
      const eventId = `${data.turnoId}-${data.timestamp || Date.now()}`;
      if (ultimoEvento === eventId) {
        console.log('⏭️ Evento duplicado ignorado');
        return;
      }
      setUltimoEvento(eventId);
      
      toast.success(`🆕 Nueva solicitud de apoyo - ${data.mensaje}`, {
        duration: 8000,
        icon: '🙏',
        style: {
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          maxWidth: '400px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }
      });

      cargarTurnos();
      cargarMiCarga();
    });

    socket.on('nuevo-mensaje', (data) => {
      console.log('📨 NUEVO MENSAJE RECIBIDO EN GUÍA DASHBOARD:', data);
      recargarNoLeidos();
    });

    socket.on('estado-turno-actualizado', async (data) => {
      console.log('🔥 Cambio de estado en guía:', data);
      await cargarTurnos();
      await cargarMiCarga();
      
      if (data.estado === 'cancelado') {
        try {
          const result = await turnosService.contarCancelacionesNoVistas();
          setNuevasCancelacionesCount(result.count);
        } catch (error) {
          console.error('Error al contar cancelaciones:', error);
        }
      }
    });

    socket.on('nueva-solicitud-mismo-guia', (data) => {
      console.log('📢 Solicitud de reprogramación con mismo guía:', data);
      
      toast.success(`🔄 ${data.mensaje}`, {
        duration: 8000,
        icon: '🔄',
        style: {
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          maxWidth: '400px'
        }
      });
      
      cargarTurnos();
      cargarMiCarga();
    });

    return () => {
      socket.off('nuevo-turno-disponible');
      socket.off('nuevo-mensaje');
      socket.off('estado-turno-actualizado');
      socket.off('nueva-solicitud-mismo-guia');
    };
  }, [socket, connected, ultimoEvento, recargarNoLeidos]);

  useEffect(() => {
    if (pestañaActiva === 'cancelados' && turnosCanceladosPorMi.length > 0) {
      const marcarComoVistas = async () => {
        try {
          await turnosService.marcarCancelacionesVistas();
          setNuevasCancelacionesCount(0);
        } catch (error) {
          console.error('Error al marcar cancelaciones como vistas:', error);
        }
      };
      
      marcarComoVistas();
    }
  }, [pestañaActiva, turnosCanceladosPorMi]);

  useEffect(() => {
    const cargarConteo = async () => {
      try {
        const result = await turnosService.contarCancelacionesNoVistas();
        setNuevasCancelacionesCount(result.count);
      } catch (error) {
        console.error('Error al cargar conteo de cancelaciones:', error);
      }
    };
    
    cargarConteo();
  }, []);

  useEffect(() => {
    const cargarMiFoto = async () => {
      try {
        const data = await perfilService.getMiPerfil();
        setMiFoto(data?.foto_perfil || null);
      } catch (err) {
        console.error('Error al cargar mi foto:', err);
      }
    };
    cargarMiFoto();
  }, []);

  useEffect(() => {
    cargarMiCarga();

    const interval = setInterval(() => {
      cargarMiCarga();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // TEMPORIZADOR DE SESIÓN EN TIEMPO REAL (CORREGIDO)
  // ============================================
  useEffect(() => {
    const turnoActivo = solicitudesActivas.find(s => s.estado === 'iniciado');
    if (!turnoActivo) return;

    let intervalo: NodeJS.Timeout;

    const actualizarTiempo = async () => {
      try {
        const data = await turnosService.getTiempoSesion(turnoActivo.id);
        
        if (data.estado !== 'iniciado') {
          clearInterval(intervalo);
          return;
        }

        // 👈 FORZAR VALORES POSITIVOS
        let tiempoRestante = data.tiempoRestante || 0;
        let transcurrido = data.tiempoTranscurrido || 0;

        // Si son negativos, forzar a cero
        if (tiempoRestante < 0) tiempoRestante = 0;
        if (transcurrido < 0) transcurrido = 0;

        const duracionTotal = data.duracionTotal || 60;

        // Formatear tiempo restante
        const horas = Math.floor(tiempoRestante / 3600);
        const minutos = Math.floor((tiempoRestante % 3600) / 60);
        const segundos = Math.floor(tiempoRestante % 60);
        const tiempoFormateado = 
          `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

        // Formatear tiempo transcurrido
        const horasTrans = Math.floor(transcurrido / 3600);
        const minTrans = Math.floor((transcurrido % 3600) / 60);
        const segTrans = Math.floor(transcurrido % 60);
        const transcurridoFormateado = 
          `${String(horasTrans).padStart(2, '0')}:${String(minTrans).padStart(2, '0')}:${String(segTrans).padStart(2, '0')}`;

        // Actualizar DOM (cambiar los IDs según el dashboard)
        const tiempoSesionEl = document.getElementById('tiempo-sesion-usuario') || document.getElementById('tiempo-sesion-guia');
        const tiempoRestanteEl = document.getElementById('tiempo-restante-usuario') || document.getElementById('tiempo-restante-guia');
        const barraProgresoEl = document.getElementById('barra-progreso-usuario') || document.getElementById('barra-progreso-guia');
        const porcentajeEl = document.getElementById('porcentaje-usuario') || document.getElementById('porcentaje-guia');

        if (tiempoSesionEl) tiempoSesionEl.textContent = transcurridoFormateado;
        if (tiempoRestanteEl) tiempoRestanteEl.textContent = tiempoFormateado;

        const porcentaje = duracionTotal > 0 ? ((transcurrido / (duracionTotal * 60)) * 100) : 0;
        const porcentajeFinal = Math.min(100, porcentaje);
        
        if (barraProgresoEl) barraProgresoEl.style.width = `${porcentajeFinal}%`;
        if (porcentajeEl) porcentajeEl.textContent = `${Math.round(porcentajeFinal)}%`;

        // Advertencia de 5 minutos
        if (tiempoRestante <= 300 && tiempoRestante > 0 && data.debeAdvertir) {
          toast('⚠️ Quedan 5 minutos de sesión. Solicita más tiempo si lo necesitas.', {
            duration: 10000,
            icon: '⏰',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            }
          });
        }

        if (tiempoRestante <= 0) {
          toast('⏰ Tiempo de sesión agotado. La sesión se cerrará automáticamente.', {
            duration: 5000,
            icon: '⏰',
          });
        }

      } catch (error) {
        console.error('Error al actualizar tiempo de sesión:', error);
      }
    };

    actualizarTiempo();
    intervalo = setInterval(actualizarTiempo, 1000);

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [turnos]);


  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const data = await turnosService.getMisTurnos();
      // 👈 CORREGIDO: Tipar el parámetro 't' en el map
      console.log('📋 Turnos recibidos:', data.turnos.map((t: Turno) => ({ id: t.id, estado: t.estado })));
      setTurnos(data.turnos);
    } catch (err) {
      setError('Error al cargar turnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (turnoId: string, nuevoEstado: string, motivo?: string) => {
    try {
      await turnosService.actualizarEstado(turnoId, nuevoEstado, motivo);
      cargarTurnos();
      cargarMiCarga();
      
      toast.success(`Turno ${nuevoEstado}`, {
        duration: 3000,
        icon: '✅',
      });

      if (nuevoEstado === 'iniciado') {
        navigate(`/turnos/${turnoId}`);
      }
    } catch (err) {
      setError('Error al actualizar estado');
      console.error(err);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-500 text-white';
      case 'aceptado': return 'bg-blue-500 text-white';
      case 'iniciado': return 'bg-green-500 text-white';
      case 'completado': return 'bg-gray-500 text-white';
      case 'cancelado': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!user || user.rol !== 'guia') {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
          <p className="text-[24px] text-gray-600 mt-3">
            <span className="font-semibold text-primario">{user.nombre}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Turnos Activos</p>
              <p className="text-2xl font-bold text-primario">{miCarga.activos}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{miCarga.pendientes}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Curso</p>
              <p className="text-2xl font-bold text-green-600">{miCarga.enCurso}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximas 24h</p>
              <p className="text-2xl font-bold text-purple-600">{miCarga.proximas24h}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Temporizador de sesión para el guía */}
      {turnos.some(t => t.estado === 'iniciado') && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">⏱️ Tiempo de sesión</p>
              <p className="text-2xl font-bold text-blue-600" id="tiempo-sesion-guia">
                00:00:00
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">⏳ Tiempo restante</p>
              <p className="text-2xl font-bold text-orange-600" id="tiempo-restante-guia">
                01:00:00
              </p>
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                  id="barra-progreso-guia"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center" id="porcentaje-guia">0%</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Pestañas - El resto del código sigue igual */}
      <div className="mb-8">
        <div className="md:hidden">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="w-full bg-gray-100/80 p-3 rounded-2xl flex items-center justify-between"
          >
            <span className="font-medium text-primario">
              {pestañaActiva === 'activos' && '📋 Turnos Activos'}
              {pestañaActiva === 'cancelados' && '✗ Cancelados'}
              {pestañaActiva === 'historial' && '📚 Historial'}
            </span>
            <span className={`transform transition-transform ${menuAbierto ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {menuAbierto && (
            <div className="mt-2 bg-gray-100/80 rounded-2xl p-2 space-y-1">
              <button
                onClick={() => { setPestañaActiva('activos'); setMenuAbierto(false); }}
                className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
                  pestañaActiva === 'activos' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
                }`}
              >
                <span>📋</span>
                <span>Turnos Activos</span>
                {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length > 0 && (
                  <span className="bg-primario text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                    {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => { setPestañaActiva('cancelados'); setMenuAbierto(false); }}
                className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
                  pestañaActiva === 'cancelados' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
                }`}
              >
                <span>✗</span>
                <span>Cancelados</span>
                {nuevasCancelacionesCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto animate-pulse">
                    {nuevasCancelacionesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setPestañaActiva('historial'); setMenuAbierto(false); }}
                className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
                  pestañaActiva === 'historial' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
                }`}
              >
                <span>📚</span>
                <span>Historial</span>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-wrap gap-2 bg-gray-100/80 p-2 rounded-2xl">
          <button
            onClick={() => setPestañaActiva('activos')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
              pestañaActiva === 'activos'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-lg">📋</span>
            <span>Turnos Activos</span>
            {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length > 0 && (
              <span className="bg-primario text-white text-xs px-2 py-0.5 rounded-full">
                {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setPestañaActiva('cancelados')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
              pestañaActiva === 'cancelados'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-lg">✗</span>
            <span>Cancelados</span>
            {nuevasCancelacionesCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {nuevasCancelacionesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setPestañaActiva('historial')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
              pestañaActiva === 'historial'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-lg">📚</span>
            <span>Historial</span>
          </button>
        </div>
      </div>

      {pestañaActiva === 'activos' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primario mb-4">
            Mis Turnos Asignados
          </h2>

          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length === 0 ? (
            <p className="text-gray-500">No tienes turnos activos</p>
          ) : (
            <div className="space-y-4">
              {turnos
                .filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado))
                .map((turno) => (
                <div 
                  key={turno.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/turnos/${turno.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFecha(turno.fecha_programada)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{turno.usuario_nombre}</p>
                        {noLeidos[turno.id] > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            {noLeidos[turno.id]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{turno.usuario_email}</p>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {turno.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => handleCambiarEstado(turno.id, 'aceptado')}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => setModalCancelar({ abierto: true, turnoId: turno.id })}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                      
                      {turno.estado === 'aceptado' && (
                        <>
                          <button
                            onClick={() => handleCambiarEstado(turno.id, 'iniciado')}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
                          >
                            Iniciar
                          </button>
                          <button
                            onClick={() => setModalCancelar({ abierto: true, turnoId: turno.id })}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      
                      {turno.estado === 'iniciado' && (
                        <>
                          <button
                            onClick={() => handleCambiarEstado(turno.id, 'completado')}
                            className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => setModalCancelar({ abierto: true, turnoId: turno.id })}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pestañaActiva === 'cancelados' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primario mb-4">
            Mis Turnos Cancelados
          </h2>

          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnosCanceladosPorMi.length === 0 ? (
            <p className="text-gray-500">No has cancelado ningún turno</p>
          ) : (
            <div className="space-y-4">
              {turnosCanceladosPorMi.map((turno) => (
                <div 
                  key={turno.id} 
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Cancelado
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFecha(turno.fecha_programada)}
                        </span>
                      </div>
                      <p className="font-medium">{turno.usuario_nombre}</p>
                      <p className="text-sm text-gray-600">{turno.usuario_email}</p>
                      {turno.motivo_cancelacion && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Motivo:</span> {turno.motivo_cancelacion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pestañaActiva === 'historial' && (
        <HistorialTurnos rol="guia" />
      )}

      <ModalCancelarTurno
        isOpen={modalCancelar.abierto}
        onClose={() => setModalCancelar({ abierto: false, turnoId: null })}
        onConfirm={(motivo) => {
          if (modalCancelar.turnoId) {
            handleCambiarEstado(modalCancelar.turnoId, 'cancelado', motivo);
          }
        }}
        fechaProgramada={turnos.find(t => t.id === modalCancelar.turnoId)?.fecha_programada}
      />
    </Layout>
  );
};

export default GuiaDashboard;