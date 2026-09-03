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
  const [duracionTotal] = useState(60);
  const [advertencia5minMostrada, setAdvertencia5minMostrada] = useState(false);
  const [tiempoAgotadoMostrado, setTiempoAgotadoMostrado] = useState(false);

  // ✅ NUEVO: Reiniciar estados SOLO cuando cambia el ID del turno
  useEffect(() => {
    if (turno?.id) {
      setAdvertencia5minMostrada(false);
      setTiempoAgotadoMostrado(false);
    }
  }, [turno?.id]); // Solo depende del ID del turno, no de todo el objeto

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

  // ============================================
  // TEMPORIZADOR DE SESIÓN EN DETALLE DEL TURNO
  // ============================================
  useEffect(() => {
    if (!turno || turno.estado !== 'iniciado') return;

    let intervalo: NodeJS.Timeout;

    const actualizarTiempo = async () => {
      try {
        const data = await turnosService.getTiempoSesion(turno.id);
        
        if (data.estado !== 'iniciado') {
          clearInterval(intervalo);
          return;
        }

        let tiempoRestante = data.tiempoRestante || 0;
        let transcurrido = data.tiempoTranscurrido || 0;

        if (tiempoRestante < 0) tiempoRestante = 0;
        if (transcurrido < 0) transcurrido = 0;

        const duracionTotal = data.duracionTotal || 60;

        const horas = Math.floor(tiempoRestante / 3600);
        const minutos = Math.floor((tiempoRestante % 3600) / 60);
        const segundos = Math.floor(tiempoRestante % 60);
        const tiempoFormateado = 
          `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

        const horasTrans = Math.floor(transcurrido / 3600);
        const minTrans = Math.floor((transcurrido % 3600) / 60);
        const segTrans = Math.floor(transcurrido % 60);
        const transcurridoFormateado = 
          `${String(horasTrans).padStart(2, '0')}:${String(minTrans).padStart(2, '0')}:${String(segTrans).padStart(2, '0')}`;

        const tiempoSesionEl = document.getElementById('tiempo-sesion-detalle');
        const tiempoRestanteEl = document.getElementById('tiempo-restante-detalle');
        const barraProgresoEl = document.getElementById('barra-progreso-detalle');
        const porcentajeEl = document.getElementById('porcentaje-detalle');

        if (tiempoSesionEl) tiempoSesionEl.textContent = transcurridoFormateado;
        if (tiempoRestanteEl) tiempoRestanteEl.textContent = tiempoFormateado;

        const porcentaje = duracionTotal > 0 ? ((transcurrido / (duracionTotal * 60)) * 100) : 0;
        const porcentajeFinal = Math.min(100, porcentaje);
        
        if (barraProgresoEl) barraProgresoEl.style.width = `${porcentajeFinal}%`;
        if (porcentajeEl) porcentajeEl.textContent = `${Math.round(porcentajeFinal)}%`;

        // Advertencia de 5 minutos (solo una vez)
        if (tiempoRestante <= 300 && tiempoRestante > 0 && data.debeAdvertir && !advertencia5minMostrada) {
          toast('⚠️ Quedan 5 minutos de sesión.', {
            duration: 10000,
            icon: '⏰',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            }
          });
          setAdvertencia5minMostrada(true); // ✅ Evita que se repita
        }

        // Tiempo agotado (solo una vez)
        if (tiempoRestante <= 0 && !tiempoAgotadoMostrado) {
          toast('⏰ Tiempo de sesión agotado.', {
            duration: 5000,
            icon: '⏰',
          });
          setTiempoAgotadoMostrado(true); // ✅ Evita que se repita
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
  }, [turno]);

  // ============================================
  // CARGAR TURNO
  // ============================================
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

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
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

  // ============================================
  // SOLICITAR EXTENSIÓN DE SESIÓN
  // ============================================
  const handleSolicitarExtension = async () => {
    if (!turno) return;
    
    const horasExtra = prompt('¿Cuántas horas extra deseas solicitar? (1, 2 o 3)', '1');
    
    if (!horasExtra) return;
    
    const horas = parseInt(horasExtra);
    if (isNaN(horas) || horas < 1 || horas > 3) {
      toast.error('Por favor, ingresa un número válido (1, 2 o 3)');
      return;
    }
    
    try {
      await turnosService.solicitarExtension(turno.id, horas);
      toast.success(`✅ Sesión extendida ${horas} hora(s)`, {
        duration: 5000,
        icon: '⏰'
      });
      cargarTurno();
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al solicitar extensión';
      toast.error(mensaje);
      console.error('Error al solicitar extensión:', error);
    }
  };

  // ============================================
  // FORMATO DE FECHA
  // ============================================
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

  const nombreUsuario = turno.usuario?.nombre || turno.usuario_nombre || 'Usuario';
  const nombreGuia = turno.guia?.nombre || turno.guia_nombre || 'Guía';

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
              <p className="font-semibold">{nombreUsuario}</p>
            </div>
            {turno.guia && (
              <div>
                <p className="text-sm text-gray-500">Guía</p>
                <p className="font-semibold">{nombreGuia}</p>
              </div>
            )}
          </div>

          {/* 👈 TEMPORIZADOR DE SESIÓN EN DETALLE */}
          {turno.estado === 'iniciado' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">⏱️ Tiempo de sesión</p>
                  <p className="text-lg font-bold text-blue-600" id="tiempo-sesion-detalle">
                    00:00:00
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">⏳ Tiempo restante</p>
                  <p className="text-lg font-bold text-orange-600" id="tiempo-restante-detalle">
                    01:00:00
                  </p>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                      id="barra-progreso-detalle"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center" id="porcentaje-detalle">0%</p>
                </div>
                <button
                  onClick={handleSolicitarExtension}
                  className="bg-primario text-white px-4 py-2 rounded-lg text-sm hover:bg-primario-dark whitespace-nowrap"
                >
                  ⏰ Solicitar más tiempo
                </button>
              </div>
            </div>
          )}

          {esGuia && turno.estado === 'pendiente' && (
            <button
              onClick={() => handleCambiarEstado('aceptado')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Aceptar turno
            </button>
          )}
        </div>

        {/* Sección de chat */}
        {puedeChat && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h2 className="font-semibold text-primario">
                Chat con {esGuia ? nombreUsuario : nombreGuia}
              </h2>
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