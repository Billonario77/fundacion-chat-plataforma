import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// ============================================
// INTERFAZ PARA TURNOS
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

// ============================================
// SERVICIO DE PERFIL (CORREGIDO)
// ============================================

export const perfilService = {
  getMiPerfil: async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 👈 DEBUG: Verificar si el token existe
      console.log('🔑 getMiPerfil - Token:', token ? '✅ Existe' : '❌ NO EXISTE');
      
      if (!token) {
        console.warn('⚠️ No hay token, no se puede obtener el perfil');
        return null;
      }

      console.log('📡 Haciendo llamada a /turnos/mi-perfil');
      
      const response = await axios.get(`${API_URL}/turnos/mi-perfil`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log('✅ Perfil obtenido:', response.data);
      return response.data;
      
    } catch (error) {
      // 👈 Manejo detallado del error
      if (axios.isAxiosError(error)) {
        console.error('❌ Error al obtener perfil:');
        console.error('   - Status:', error.response?.status);
        console.error('   - Data:', error.response?.data);
        console.error('   - Config:', error.config);
      } else {
        console.error('❌ Error desconocido:', error);
      }
      // 👈 Retornar null en lugar de lanzar error
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
// SERVICIO DE TURNOS
// ============================================

export const turnosService = {
  // Obtener turnos del guía
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

  // Obtener solicitudes del usuario
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

  // Actualizar estado del turno
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

  // Cancelar turno
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

  // Obtener historial de turnos
  getHistorial: async (page: number = 1, limit: number = 10) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/turnos/historial`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  },

  // Marcar cancelaciones como vistas
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

  // Contar cancelaciones no vistas
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
// SERVICIO DE USUARIO (para solicitar apoyo)
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
};