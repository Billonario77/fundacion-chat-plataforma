import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface MensajeIA {
  id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  created_at: string;
}

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

export const aiService = {
  enviarMensaje: async (mensaje: string): Promise<string> => {
    const response = await axios.post(
      `${API_URL}/ai/mensaje`,
      { mensaje },
      headers()
    );
    return response.data.data.respuesta;
  },

  obtenerHistorial: async (): Promise<MensajeIA[]> => {
    const response = await axios.get(`${API_URL}/ai/historial`, headers());
    return response.data.data;
  },

  enviarMensajePublico: async (historial: { rol: string, contenido: string }[]): Promise<string> => {
    const response = await axios.post(`${API_URL}/ai/publico`, { historial });
    return response.data.data.respuesta;
  },
};