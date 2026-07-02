import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const grabacionService = {
  // Solicitar grabación
  solicitarGrabacion: async (turnoId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/grabacion/iniciar`,
      { turnoId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Responder a solicitud
  responderGrabacion: async (turnoId: string, respuesta: 'aprobado' | 'rechazado'): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/grabacion/${turnoId}/responder`,
      { respuesta },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Finalizar grabación
  finalizarGrabacion: async (turnoId: string, urlGrabacion: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/grabacion/${turnoId}/finalizar`,
      { urlGrabacion },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};