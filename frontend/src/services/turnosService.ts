import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// ============================================
// INTERFACES
// ============================================

export interface Turno {
  id: string;
  fecha_programada: string;
  duracion_minutos: number;
  modalidad: string;
  estado: string;
  created_at: string;
  motivo_cancelacion?: string;
  cancelado_por?: string;
  usuario_nombre?: string;
  usuario_email?: string;
  guia_nombre?: string;
  guia_email?: string;
  requiere_asignacion_admin?: boolean;
  es_reprogramacion?: boolean;
  turno_original_id?: string;
}

export interface TurnoDetalle extends Turno {
  usuario_id?: string;
  guia_id?: string;
  hora_inicio?: string;
  recordatorio_24h_enviado?: boolean;
  recordatorio_1h_enviado?: boolean;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
  guia?: {
    id: string;
    nombre: string;
  };
  recordatorios?: {
    enviado_24h: boolean;
    enviado_1h: boolean;
  };
}

export interface Cancelacion {
  id: string;
  fecha_cancelacion: string;
  fecha_programada: string;
  motivo_cancelacion: string;
  cancelado_por: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  guia_id: string | null;
  guia_nombre: string | null;
  guia_email: string | null;
}

export interface CancelacionFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  cancelado_por?: string;
  guia_id?: string;
  usuario_id?: string;
}

// ============================================
// PERFIL SERVICE
// ============================================

export const perfilService = {
  getMiPerfil: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No hay token, no se puede obtener el perfil');
        return null;
      }

      const response = await axios.get(`${API_URL}/turnos/mi-perfil`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      return null;
    }
  },

  actualizarFoto: async (foto_perfil: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No hay token, no se puede actualizar la foto');
        return null;
      }
      
      const response = await axios.put(
        `${API_URL}/turnos/mi-foto`,
        { foto_perfil },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
      
    } catch (error) {
      console.error('❌ Error al actualizar foto:', error);
      return null;
    }
  },
};

// ============================================
// TURNOS SERVICE (CON TODAS LAS FUNCIONES)
// ============================================

export const turnosService = {
  getMisTurnos: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/mis-turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener turnos:', error);
      throw error;
    }
  },

  getMisSolicitudes: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/mis-solicitudes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  },

  actualizarEstado: async (turnoId: string, estado: string, motivo?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/turnos/${turnoId}/estado`,
        { estado, motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }
  },

  cancelarTurno: async (turnoId: string, motivo: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/turnos/${turnoId}/cancelar`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      throw error;
    }
  },

  // 👈 NUEVA FUNCIÓN: Obtener detalle de un turno específico
  getTurnoDetalle: async (turnoId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/${turnoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle del turno:', error);
      throw error;
    }
  },

  getHistorialTurnos: async (page: number = 1, limit: number = 10) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/historial`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de turnos:', error);
      throw error;
    }
  },

  getHistorial: async (page: number = 1, limit: number = 10) => {
    return turnosService.getHistorialTurnos(page, limit);
  },

  obtenerCancelacionesAdmin: async (filtros: CancelacionFiltros & { page?: number; limit?: number }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/cancelaciones/admin`, {
        params: filtros,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener cancelaciones:', error);
      throw error;
    }
  },

  obtenerMetricasCancelaciones: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/cancelaciones/metricas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas de cancelaciones:', error);
      throw error;
    }
  },

  getHistorialAdmin: async (filtros: { 
    fecha_desde?: string; 
    fecha_hasta?: string; 
    estado?: string; 
    usuario_id?: string; 
    guia_id?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/historial/admin`, {
        params: filtros,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial admin:', error);
      throw error;
    }
  },

  marcarCancelacionesVistas: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/turnos/cancelaciones/marcar-vistas`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al marcar cancelaciones:', error);
      throw error;
    }
  },

  contarCancelacionesNoVistas: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/turnos/cancelaciones/no-vistas/count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al contar cancelaciones:', error);
      throw error;
    }
  },
};

// ============================================
// USUARIO SERVICE
// ============================================

export const usuarioService = {
  solicitarApoyo: async (rol: string, mensaje: string, fechaPreferida?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/turnos/solicitar`,
        { rol, mensajeInicial: mensaje, fechaPreferida },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al solicitar apoyo:', error);
      throw error;
    }
  },

  getMisSolicitudes: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/mis-solicitudes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  },

  getMiPerfil: async () => {
    return perfilService.getMiPerfil();
  },

  reprogramarTurno: async (turnoId: string, preferencia: string, fechaPreferida: string, comentarios?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/turnos/${turnoId}/reprogramar`,
        { preferencia, fecha_preferida: fechaPreferida, comentarios },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al reprogramar turno:', error);
      throw error;
    }
  },

  completarMisDatos: async (datos: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/turnos/completar-datos`,
        datos,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al completar datos:', error);
      throw error;
    }
  },
};