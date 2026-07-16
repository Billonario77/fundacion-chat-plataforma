import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axios from 'axios';

const API_URL = 'https://fundacion-chat-backend-api.onrender.com/api';

interface MensajesNoLeidosContextType {
  noLeidos: Record<string, number>;
  totalNoLeidos: number;
  marcarComoLeidos: (turnoId: string) => Promise<void>;
  recargarNoLeidos: () => Promise<void>;
}

const MensajesNoLeidosContext = createContext<MensajesNoLeidosContextType | undefined>(undefined);

export const useMensajesNoLeidos = () => {
  const context = useContext(MensajesNoLeidosContext);
  if (!context) {
    throw new Error('useMensajesNoLeidos debe usarse dentro de MensajesNoLeidosProvider');
  }
  return context;
};

export const MensajesNoLeidosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();
  const [noLeidos, setNoLeidos] = useState<Record<string, number>>({});

  // Calcular total de mensajes no leídos
  const totalNoLeidos = Object.values(noLeidos).reduce((acc, count) => acc + count, 0);

  // Función para recargar desde el backend
  const recargarNoLeidos = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mensajes/no-leidos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNoLeidos(response.data.noLeidos);
      console.log('📊 Mensajes no leídos:', response.data.noLeidos);
    } catch (error) {
      console.error('Error al cargar mensajes no leídos:', error);
    }
  };

  // Función para marcar mensajes como leídos
  const marcarComoLeidos = async (turnoId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/mensajes/turno/${turnoId}/leer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar estado local (eliminar ese turno del objeto noLeidos)
      setNoLeidos(prev => {
        const newState = { ...prev };
        delete newState[turnoId];
        return newState;
      });
      
      console.log(`✅ Mensajes del turno ${turnoId} marcados como leídos`);
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  };

  // Escuchar eventos de socket en tiempo real
  useEffect(() => {
    if (!socket || !connected || !isAuthenticated) return;

    console.log('🔌 Escuchando eventos de mensajes en tiempo real');

    // Cuando llega un NUEVO MENSAJE
    const handleNuevoMensaje = (data: { turnoId: string; remitenteId: string }) => {
      console.log('📨 NUEVO MENSAJE RECIBIDO - ACTUALIZANDO BADGE INMEDIATAMENTE:', data);
      
      // Incrementar contador para ese turno
      setNoLeidos(prev => ({
        ...prev,
        [data.turnoId]: (prev[data.turnoId] || 0) + 1
      }));
    };

    // Cuando el otro usuario MARCA COMO LEÍDOS los mensajes
    const handleMensajesLeidos = (data: { turnoId: string; leidosPor: string; cantidad: number }) => {
    console.log('✅ MENSAJES MARCADOS COMO LEÍDOS - ELIMINANDO BADGE INMEDIATAMENTE:', data);
    console.log('🔍 Estado ANTES de eliminar:', noLeidos); // <-- AGREGAR ESTO
    
    // Resetear el contador para ese turno (todos los mensajes fueron leídos)
    setNoLeidos(prev => {
        console.log('🔍 Estado PREVIO en setNoLeidos:', prev);
        const newState = { ...prev };
        delete newState[data.turnoId];
        console.log('🔍 Estado NUEVO en setNoLeidos:', newState);
        return newState;
    });
    };

    // Registrar los listeners
    socket.on('nuevo-mensaje', handleNuevoMensaje);
    socket.on('mensajes-leidos', handleMensajesLeidos);

    // Limpiar listeners al desmontar
    return () => {
      socket.off('nuevo-mensaje', handleNuevoMensaje);
      socket.off('mensajes-leidos', handleMensajesLeidos);
    };
  }, [socket, connected, isAuthenticated]);

  // Cargar datos iniciales cuando el usuario se autentica (SOLO UNA VEZ)
  useEffect(() => {
    if (isAuthenticated && user) {
      recargarNoLeidos();
    }
  }, [isAuthenticated, user]); // SIN INTERVALO

  return (
    <MensajesNoLeidosContext.Provider value={{ 
      noLeidos, 
      totalNoLeidos, 
      marcarComoLeidos, 
      recargarNoLeidos 
    }}>
      {children}
    </MensajesNoLeidosContext.Provider>
  );
};