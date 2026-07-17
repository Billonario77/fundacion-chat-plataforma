import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMensajesNoLeidos } from '../contexts/MensajesNoLeidosContext';
import toast from 'react-hot-toast';
import { turnosService, Turno, usuarioService, perfilService } from '../services/turnosService';
import HistorialTurnos from '../components/HistorialTurnos';
import Layout from '../components/Layout';
import ModalCancelarTurno from '../components/ModalCancelarTurno';
import Avatar from '../components/Avatar';

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
  
  // Estados para cancelaciones y foto
  const [nuevasCancelacionesCount, setNuevasCancelacionesCount] = useState(0);
  const [miFoto, setMiFoto] = useState<string | null>(null);

  // Turnos cancelados por el GUÍA
  const turnosCanceladosPorMi = turnos.filter(t => 
    t.estado === 'cancelado' && t.cancelado_por === 'guia'
  );

  useEffect(() => {
    if (pestañaActiva === 'activos' || pestañaActiva === 'cancelados') {
      cargarTurnos();
    }
  }, [pestañaActiva]);

  // ESCUCHAR NOTIFICACIONES EN TIEMPO REAL
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Guía escuchando notificaciones...');

    socket.off('nuevo-turno-disponible');
    socket.off('nuevo-mensaje');

    socket.on('nuevo-turno-disponible', (data) => {
      console.log('📨 Nueva solicitud recibida:', data);
      cargarTurnos();
      
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
    });

    socket.on('nuevo-mensaje', (data) => {
      console.log('📨 NUEVO MENSAJE RECIBIDO EN GUÍA DASHBOARD:', data);
      recargarNoLeidos();
    });

    socket.on('estado-turno-actualizado', async (data) => {
      console.log('🔥 Cambio de estado en guía:', data);
      await cargarTurnos();
      
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
    });

    return () => {
      socket.off('nuevo-turno-disponible');
      socket.off('nuevo-mensaje');
      socket.off('estado-turno-actualizado');
      socket.off('nueva-solicitud-mismo-guia');
    };
  }, [socket, connected, ultimoEvento, recargarNoLeidos]);

  // Marcar cancelaciones como vistas al entrar a la pestaña
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

  // Cargar conteo de cancelaciones no vistas al iniciar
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

  // Cargar foto de perfil del guía
  useEffect(() => {
    const cargarMiFoto = async () => {
      try {
        const data = await perfilService.getMiPerfil();
        setMiFoto(data.foto_perfil);
      } catch (err) {
        console.error('Error al cargar mi foto:', err);
      }
    };
    cargarMiFoto();
  }, []);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const data = await turnosService.getMisTurnos();
      console.log('📋 Turnos recibidos:', data.turnos.map(t => ({ id: t.id, estado: t.estado })));
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Pestañas con menú hamburguesa para móvil */}
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
