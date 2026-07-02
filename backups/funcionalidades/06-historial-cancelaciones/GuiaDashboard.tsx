import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMensajesNoLeidos } from '../contexts/MensajesNoLeidosContext';
import toast from 'react-hot-toast';
import { turnosService, Turno } from '../services/turnosService';
import HistorialTurnos from '../components/HistorialTurnos';
import Layout from '../components/Layout';
import ModalCancelarTurno from '../components/ModalCancelarTurno';

const GuiaDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { noLeidos, recargarNoLeidos } = useMensajesNoLeidos(); // <-- AGREGADO recargarNoLeidos

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

  useEffect(() => {
    if (pestañaActiva === 'activos' || pestañaActiva === 'cancelados') {
      cargarTurnos();
    }
  }, [pestañaActiva]);

  // ============================================
  // ESCUCHAR NOTIFICACIONES EN TIEMPO REAL
  // ============================================
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Guía escuchando notificaciones...');

    // Remover listeners existentes
    socket.off('nuevo-turno-disponible');
    socket.off('nuevo-mensaje'); // <-- ASEGURAR QUE NO HAY DUPLICADOS

    // Escuchar nuevos turnos disponibles
    socket.on('nuevo-turno-disponible', (data) => {
      console.log('📨 Nueva solicitud recibida:', data);
      cargarTurnos();
      
      // Evitar duplicados
      const eventId = `${data.turnoId}-${data.timestamp || Date.now()}`;
      if (ultimoEvento === eventId) {
        console.log('⏭️ Evento duplicado ignorado');
        return;
      }
      setUltimoEvento(eventId);
      
      // Toast
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

    // ============================================
    // NUEVO: Escuchar nuevos mensajes
    // ============================================
    socket.on('nuevo-mensaje', (data) => {
      console.log('📨 NUEVO MENSAJE RECIBIDO EN GUÍA DASHBOARD:', data);
      // Recargar contador de mensajes no leídos
      recargarNoLeidos();
    });

    // Escuchar cambios de estado (cuando usuario cancela, etc)
    socket.on('estado-turno-actualizado', (data) => {
      console.log('🔥 Cambio de estado en guía:', data);
      cargarTurnos(); // <-- Recargar turnos inmediatamente
    });

    return () => {
      socket.off('nuevo-turno-disponible');
      socket.off('nuevo-mensaje');
      socket.off('estado-turno-actualizado'); 
    };
  }, [socket, connected, ultimoEvento, recargarNoLeidos]); // <-- AGREGADO recargarNoLeidos

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

      // Si el estado es "iniciado", ir al detalle del turno (donde está el chat)
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.tipo !== 'guia') {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primario">
            Panel de Guía
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user.nombre}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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

      {/* Pestañas */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl inline-flex">
          <button
            onClick={() => setPestañaActiva('activos')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              pestañaActiva === 'activos'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-xl">📋</span>
            <span>Turnos Activos</span>
            {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length > 0 && (
              <span className="bg-primario text-white text-xs px-2 py-1 rounded-full ml-2">
                {turnos.filter(t => ['pendiente', 'aceptado', 'iniciado'].includes(t.estado)).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setPestañaActiva('cancelados')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              pestañaActiva === 'cancelados'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-xl">✗</span>
            <span>Cancelados</span>
            {turnos.filter(t => t.estado === 'cancelado' && t.cancelado_por === 'guia').length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
            {turnos.filter(t => t.estado === 'cancelado' && t.cancelado_por === 'guia').length}
            </span>
          )}
          </button>

          <button
            onClick={() => setPestañaActiva('historial')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              pestañaActiva === 'historial'
                ? 'bg-white text-primario shadow-md' 
                : 'text-texto-claro hover:bg-white/50 hover:text-primario'
            }`}
          >
            <span className="text-xl">📚</span>
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
            Turnos Cancelados por Mi
          </h2>

          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnos.filter(t => t.estado === 'cancelado' && t.cancelado_por === 'guia').length === 0 ? (
            <p className="text-gray-500">No haz Cancelado turnos.</p>
          ) : (
            <div className="space-y-4">
              {turnos
                .filter(t => t.estado === 'cancelado' && t.cancelado_por === 'guia')
                .map((turno) => (
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