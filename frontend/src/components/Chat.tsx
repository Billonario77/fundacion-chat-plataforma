import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useMensajesNoLeidos } from '../contexts/MensajesNoLeidosContext';
import { mensajesService, Mensaje } from '../services/mensajesService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ModalConfirmarFinalizar from './ModalConfirmarFinalizar';

interface ChatProps {
  turnoId: string;
  onClose?: () => void;
  estado?: string;
  onFinalizar?: () => void;
}

const Chat: React.FC<ChatProps> = ({ turnoId, onClose, estado, onFinalizar }) => {
  console.log('🎯 Chat montado - turnoId:', turnoId, 'estado:', estado, 'tipo:', typeof estado);
  const { user } = useAuth();
  const { socket, connected, unirseATurno, salirDeTurno } = useSocket();
  const { recargarNoLeidos } = useMensajesNoLeidos();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false); // <-- NUEVO
  
  // Estados para indicador de "escribiendo..."
  const [escribiendo, setEscribiendo] = useState(false);
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Unirse a la sala del turno al montar el componente
  useEffect(() => {
    if (connected && turnoId) {
      console.log(`🔊 Chat: Uniéndose a sala del turno ${turnoId}`);
      unirseATurno(turnoId);
    }
    
    // Salir de la sala al desmontar
    return () => {
      if (connected && turnoId) {
        console.log(`🔇 Chat: Saliendo de sala del turno ${turnoId}`);
        salirDeTurno(turnoId);
      }
      // Limpiar timeout si existe
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connected, turnoId, unirseATurno, salirDeTurno]);

  // Cargar mensajes existentes
  useEffect(() => {
    cargarMensajes();
  }, [turnoId]);

  // Escuchar nuevos mensajes en tiempo real
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Chat: Escuchando nuevos mensajes...');

    socket.off('nuevo-mensaje');
    
    socket.on('nuevo-mensaje', (data) => {
      console.log('📨 Chat: Nuevo mensaje recibido:', data);
      
      if (data.turnoId === turnoId) {
        setMensajes(prev => [...prev, data.mensaje]);
        
        // Scroll automático al nuevo mensaje
        setTimeout(() => {
          mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Si el mensaje no es del usuario actual, mostrar notificación
        if (data.mensaje.emisor_id !== user?.id) {
          toast('📩 Nuevo mensaje', {
            icon: '💬',
            duration: 3000,
            style: {
              background: '#3b82f6',
              color: 'white',
            }
          });
        }
      }
    });

    return () => {
      socket.off('nuevo-mensaje');
    };
  }, [socket, connected, turnoId, user?.id]);

  // Escuchar cuando alguien está escribiendo
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Chat: Escuchando indicadores de escritura...');

    socket.off('usuario-escribiendo');
    
    socket.on('usuario-escribiendo', (data: { turnoId: string; usuarioId: string; nombre: string }) => {
      console.log('✍️ Chat: Alguien está escribiendo:', data);
      
      if (data.turnoId === turnoId && data.usuarioId !== user?.id) {
        setUsuarioEscribiendo(data.nombre);
        setEscribiendo(true);
        
        // Limpiar después de 3 segundos
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setEscribiendo(false);
          setUsuarioEscribiendo(null);
        }, 3000);
      }
    });

    return () => {
      socket.off('usuario-escribiendo');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [socket, connected, turnoId, user?.id]);

  // Scroll al último mensaje (respaldo)
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const cargarMensajes = async () => {
    try {
      setLoading(true);
      const data = await mensajesService.getMensajesPorTurno(turnoId);
      setMensajes(data);
      
      // Marcar como leídos
      await mensajesService.marcarComoLeidos(turnoId);
      
      // Recargar contador de no leídos
      await recargarNoLeidos();
      
      // Forzar scroll al último mensaje después de cargar
      setTimeout(() => {
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim()) return;
    
    try {
      setEnviando(true);
      const mensaje = await mensajesService.enviarMensaje(turnoId, nuevoMensaje);
      setMensajes(prev => [...prev, mensaje]);
      setNuevoMensaje('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !connected || !turnoId || !user) return;
    
    socket.emit('escribiendo', {
      turnoId,
      usuarioId: user.id,
      nombre: user.nombre || 'Usuario'
    });
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMio = (mensaje: Mensaje) => {
    return mensaje.emisor_id === user?.id;
  };

  // ============================================
  // MODIFICADO: Ahora abre el modal en lugar de confirm nativo
  // ============================================
  const handleFinalizar = () => {
    setMostrarModalFinalizar(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg">
      {/* Header del chat */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-primario text-white rounded-t-lg">
        <h3 className="font-semibold">Chat del turno</h3>
        <div className="flex items-center gap-2">
          {estado === 'iniciado' && (
            <button
              onClick={handleFinalizar}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Finalizar Sesión
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">
              ✕
            </button>
          )}
        </div>
      </div>
      

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {mensajes.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No hay mensajes aún. ¡Envía el primero!
          </p>
        ) : (
          mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`flex ${isMio(mensaje) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isMio(mensaje)
                    ? 'bg-primario text-white rounded-br-none'
                    : 'bg-white border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{mensaje.contenido}</p>
                <div className={`text-xs mt-1 flex justify-end items-center gap-1 ${
                  isMio(mensaje) ? 'text-primario-claro' : 'text-gray-400'
                }`}>
                  <span>{formatHora(mensaje.created_at)}</span>
                  {isMio(mensaje) && (
                    <span>{mensaje.leido ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Indicador de "escribiendo..." */}
        {escribiendo && usuarioEscribiendo && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-600 rounded-lg px-4 py-2 rounded-bl-none">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{usuarioEscribiendo}</span>
                <span className="text-sm">está escribiendo</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Elemento fantasma para hacer scroll */}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleEnviarMensaje} className="border-t p-3 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nuevoMensaje}
            onChange={(e) => {
              setNuevoMensaje(e.target.value);
              handleTyping();
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primario"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !nuevoMensaje.trim()}
            className="bg-primario text-white px-6 py-2 rounded-full hover:bg-primario-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </div>
      </form>

      {/* ============================================ */}
      {/* NUEVO: Modal personalizado para confirmar finalización */}
      {/* ============================================ */}
      <ModalConfirmarFinalizar
        isOpen={mostrarModalFinalizar}
        onClose={() => setMostrarModalFinalizar(false)}
        onConfirm={() => {
          onFinalizar?.();
          setMostrarModalFinalizar(false);
        }}
        mensaje="¿Estás seguro de que quieres finalizar esta sesión de apoyo? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default Chat;
