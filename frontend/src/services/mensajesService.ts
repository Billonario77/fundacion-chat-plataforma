import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface Mensaje {
  id: string;
  turno_id: string;
  emisor_id: string;
  emisor_tipo: 'usuario' | 'guia';
  contenido: string;
  leido: boolean;
  created_at: string;
}

export const mensajesService = {
  // Enviar un mensaje - RUTA CORRECTA
  enviarMensaje: async (turnoId: string, contenido: string): Promise<Mensaje> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // 👈 USAR LA RUTA CORRECTA: /mensajes/ (sin /enviar)
    const response = await axios.post(
      `${API_URL}/mensajes/`,
      { turnoId, contenido },  // 👈 Asegurar que los nombres coinciden con el backend
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    return response.data;
  },

  // Obtener mensajes de un turno
  getMensajesPorTurno: async (turnoId: string): Promise<Mensaje[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/mensajes/turno/${turnoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Marcar mensajes como leídos
  marcarComoLeidos: async (turnoId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/mensajes/turno/${turnoId}/leer`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};