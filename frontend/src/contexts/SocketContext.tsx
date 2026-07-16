import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  unirseATurno: (turnoId: string) => void;
  salirDeTurno: (turnoId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token, user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Solo conectar si hay token y usuario autenticado
    if (!token || !isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    console.log('🔌 Conectando a WebSocket...');

    // Crear conexión con el token en el handshake
    const newSocket = io('https://fundacion-chat-backend-api.onrender.com', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('🟢 Conectado a WebSocket');
      setConnected(true);
      
      // REGISTRAR al usuario con su ID y rol (para el backend)
      newSocket.emit('registrar', {
        userId: user.id,
        rol: user.rol
      });
      
      console.log('📝 Usuario registrado en socket:', { userId: user.id, rol: user.rol });
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Error de conexión WebSocket:', error.message);
      setConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Desconectado de WebSocket:', reason);
      setConnected(false);
    });

    setSocket(newSocket);

    // Limpiar conexión al desmontar
    return () => {
      newSocket.disconnect();
    };
  }, [token, isAuthenticated, user]); // Re-conectar si cambia el token o usuario

  // Función para unirse a la sala de un turno específico
  const unirseATurno = (turnoId: string) => {
    if (socket && connected) {
      console.log(`🔊 Uniéndose a sala del turno: ${turnoId}`);
      socket.emit('unirse-turno', turnoId);
    } else {
      console.warn('⚠️ No se puede unir al turno: socket no conectado');
    }
  };

  // Función para salir de la sala de un turno
  const salirDeTurno = (turnoId: string) => {
    if (socket && connected) {
      console.log(`🔇 Saliendo de sala del turno: ${turnoId}`);
      socket.emit('salir-turno', turnoId);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected,
      unirseATurno,
      salirDeTurno
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook personalizado para usar el socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};