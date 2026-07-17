import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { turnosService, TurnoDetalle } from '../services/turnosService';
import Chat from '../components/Chat';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import Videollamada from '../components/Videollamada';
import { useSocket } from '../contexts/SocketContext';

const DetalleTurno: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [turno, setTurno] = useState<TurnoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarChat, setMostrarChat] = useState(true);
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const { socket, connected } = useSocket();
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [duracionTotal] = useState(60); // Duración estándar en minutos

  useEffect(() => {
  if (id) {
    cargarTurno();
  }
}, [id]);

// ============================================
// ESCUCHAR CAMBIOS DE ESTADO EN TIEMPO REAL
// ============================================
useEffect(() => {
  if (!socket || !connected || !turno) return;

  console.log('👂 DetalleTurno: Escuchando cambios de estado...');

  const handleEstadoCambiado = (data: any) => {
    console.log('🔄 DetalleTurno: Cambio de estado recibido:', data);
    
    if (data.turnoId === turno.id) {
      // Recargar el turno para mostrar el nuevo estado
      cargarTurno();
      
      toast(`📢 ${data.mensaje}`, {
        duration: 5000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: 'white',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '500'
        }
      });

      // Si el estado es 'completado', cerrar el chat automáticamente
      if (data.estado === 'completado') {
        setMostrarChat(false);
        setMostrarVideo(false);
      }
    }
  };

  socket.on('estado-turno-actualizado', handleEstadoCambiado);

  return () => {
    socket.off('estado-turno-actualizado', handleEstadoCambiado);
  };
}, [socket, connected, turno]);


// Temporizador para sesiones iniciadas
useEffect(() => {
  if (!turno || turno.estado !== 'iniciado' || !turno.hora_inicio) return;

  const horaInicio = new Date(turno.hora_inicio);
  
  const actualizarTiempo = () => {
    const ahora = new Date();
    const transcurrido = Math.floor((ahora.getTime() - horaInicio.getTime()) / 1000); // en segundos
    const transcurridoMinutos = Math.floor(transcurrido / 60);
    const transcurridoSegundos = transcurrido % 60;
    
    setTiempoTranscurrido(transcurrido);
    
    const restante = (duracionTotal * 60) - transcurrido;
    if (restante <= 0) {
      // El tiempo se acabó, finalizar automáticamente
      handleCambiarEstado('completado');
      toast('La sesión ha finalizado por tiempo', {
        icon: '⏰',
        duration: 5000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
        }
      });
    }
    setTiempoRestante(restante > 0 ? restante : 0);
  };

  actualizarTiempo();
  const intervalo = setInterval(actualizarTiempo, 1000);

  return () => clearInterval(intervalo);
}, [turno, duracionTotal]);


  const cargarTurno = async () => {
    try {
      setLoading(true);
      const data = await turnosService.getTurnoDetalle(id!);
      setTurno(data.turno);
    } catch (err) {
      setError('Error al cargar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!id) return;
    
    try {
      await turnosService.actualizarEstado(id, nuevoEstado);
      toast.success(`Turno ${nuevoEstado}`);
      cargarTurno();
    } catch (err) {
      setError('Error al actualizar estado');
      console.error(err);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-center py-8">Cargando...</p>
      </Layout>
    );
  }

  if (error || !turno) {
    return (
      <Layout>
        <p className="text-red-500 text-center py-8">{error || 'Turno no encontrado'}</p>
      </Layout>
    );
  }

  const esGuia = user?.rol === 'guia';
  const puedeChat = turno.estado === 'aceptado' || turno.estado === 'iniciado';

  console.log('🔍 DetalleTurno - turno:', turno);
  console.log('🔍 DetalleTurno - estado:', turno.estado);
  console.log('🔍 DetalleTurno - puedeChat:', puedeChat);
  console.log('🔍 DetalleTurno - mostrarChat:', mostrarChat);
  console.log('📌 PÁGINA DETALLE TURNO CARGADA');
  console.log('🔍 hora_inicio:', turno.hora_inicio);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-primario hover:text-primario-dark flex items-center gap-1"
        >
          ← Volver
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-primario mb-4">
            Detalle del Turno
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className={`font-semibold capitalize ${
                turno.estado === 'completado' ? 'text-green-600' :
                turno.estado === 'cancelado' ? 'text-red-600' :
                'text-primario'
              }`}>
                {turno.estado}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-semibold">{formatFecha(turno.fecha_programada)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modalidad</p>
              <p className="font-semibold capitalize">{turno.modalidad}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuario</p>
              <p className="font-semibold">{turno.usuario.nombre}</p>
            </div>
            {turno.guia && (
              <div>
                <p className="text-sm text-gray-500">Guía</p>
                <p className="font-semibold">{turno.guia.nombre}</p>
              </div>
            )}
          </div>

          {esGuia && turno.estado === 'pendiente' && (
            <button
              onClick={() => handleCambiarEstado('aceptado')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Aceptar turno
            </button>
          )}

          {turno.estado === 'iniciado' && turno.hora_inicio && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-blue-600 font-medium">Tiempo de sesión</p>
                  <p className="text-base font-bold text-blue-700">
                    {Math.floor(tiempoTranscurrido / 60)}:{(tiempoTranscurrido % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-orange-600 font-medium">Tiempo restante</p>
                  <p className="text-base font-bold text-orange-700">
                    {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(tiempoTranscurrido / (duracionTotal * 60)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sección de chat */}
        {puedeChat && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h2 className="font-semibold text-primario">Chat con {esGuia ? turno.usuario.nombre : turno.guia?.nombre}</h2>
              <button
                onClick={() => setMostrarChat(!mostrarChat)}
                className="text-primario hover:text-primario-dark"
              >
                {mostrarChat ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {mostrarChat && (
              <Chat 
                turnoId={turno.id} 
                estado={turno.estado}
                onFinalizar={() => handleCambiarEstado('completado')}
              />
            )}
          </div>
        )}

        {/* Botón de videollamada */}
        {puedeChat && (
          <div className="mt-4">
            <button
              onClick={() => setMostrarVideo(!mostrarVideo)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <span>📹</span>
              {mostrarVideo ? 'Ocultar videollamada' : 'Iniciar videollamada'}
            </button>
          </div>
        )}

        {/* Componente de videollamada */}
        {mostrarVideo && (
          <div className="mt-4">
            <Videollamada 
              channelName={turno.id} 
              onClose={() => setMostrarVideo(false)}
              onEmergency={() => {
                toast.error('🚨 Emergencia activada');
              }}
              tiempoTranscurrido={tiempoTranscurrido} 
              tiempoRestante={tiempoRestante}         
              duracionTotal={duracionTotal}            
            />
          </div>
        )}


      </div>
    </Layout>
  );
};

export default DetalleTurno;
