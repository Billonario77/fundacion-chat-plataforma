import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface SolicitudReprogramacion {
  id: string;
  turno_original_id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  preferencia: 'mismo_guia' | 'otro_guia' | 'cambiar_fecha';
  fecha_preferida: string | null;
  comentarios: string | null;
  estado: 'pendiente' | 'completada' | 'cancelada';
  created_at: string;
  updated_at: string;
}

export interface GuiaDisponible {
  id: string;
  nombre: string;
  email: string;
  disponible: boolean;
}

export interface TurnoPendiente {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  tipo: string;
  mensaje_inicial: string;
  estado: string;
  created_at: string;
}

export const adminService = {
  // Obtener todas las solicitudes de reprogramación pendientes
  getSolicitudesReprogramacion: async (): Promise<SolicitudReprogramacion[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/reprogramaciones/pendientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener guías disponibles para asignar
  getGuiasDisponibles: async (fecha?: string, solicitudId?: string): Promise<GuiaDisponible[]> => {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/admin/guias/disponibles`;
    const params = new URLSearchParams();
    
    if (fecha) {
      params.append('fecha', fecha);
    }
    if (solicitudId) {
      params.append('solicitudId', solicitudId);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Asignar un guía a una solicitud de reprogramación
  asignarGuia: async (solicitudId: string, guiaId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/admin/reprogramaciones/${solicitudId}/asignar`,
      { guiaId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Crear un nuevo turno a partir de una solicitud de reprogramación
  crearTurnoReprogramado: async (solicitudId: string, guiaId: string, fechaProgramada?: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/admin/reprogramaciones/${solicitudId}/crear-turno`,
      { guiaId, fechaProgramada },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener turnos pendientes de asignación (primeros usuarios)
  getTurnosPendientesAsignacion: async (): Promise<TurnoPendiente[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/turnos/pendientes-asignacion`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Asignar guía a un turno pendiente
  asignarGuiaATurno: async (turnoId: string, guiaId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/admin/turnos/${turnoId}/asignar-guia`,
      { guiaId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener lista de guías para filtros
  obtenerGuiasLista: async (): Promise<{ id: string; nombre: string; email: string }[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/guias`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener lista de usuarios para filtros
  obtenerUsuariosLista: async (): Promise<{ id: string; nombre: string; email: string }[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

};
