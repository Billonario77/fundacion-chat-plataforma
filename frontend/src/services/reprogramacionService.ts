import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface Reprogramacion {
  id: string;
  turno_original_id: string;
  preferencia: 'mismo_guia' | 'otro_guia' | 'cambiar_fecha';
  fecha_preferida: string | null;
  comentarios: string | null;
  estado: 'pendiente' | 'completada' | 'cancelada';
  created_at: string;
  updated_at: string;
  turno_original_fecha: string;
  turno_original_estado: string;
  guia_nombre: string | null;
}

export const reprogramacionService = {
  // Obtener todas mis reprogramaciones
  getMisReprogramaciones: async (): Promise<Reprogramacion[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/reprogramaciones/mis-reprogramaciones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener una reprogramación específica
  getReprogramacionById: async (reprogramacionId: string): Promise<Reprogramacion> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/reprogramaciones/${reprogramacionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cancelar una solicitud de reprogramación
  cancelarReprogramacion: async (reprogramacionId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/reprogramaciones/${reprogramacionId}/cancelar`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // ============================================
  // NUEVA: Solicitar cambio de guía (preferencia)
  // ============================================
  solicitarCambioGuia: async (preferencia: 'mismo_guia' | 'otro_guia'): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/reprogramaciones/solicitar-cambio-guia`,
      { preferencia },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
