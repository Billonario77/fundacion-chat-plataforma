import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// CONFIGURACIÓN DE AXIOS CON INTERCEPTORES
// ============================================

// 👈 Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// 👈 Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debug (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🔑 Token: ${token ? '✅ Existe' : '❌ NO EXISTE'}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// 👈 Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    // Log para debug (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Respuesta ${response.status} de ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error(`❌ Error ${error.response.status} en ${error.config?.url}:`, error.response.data);
      
      // Si es 401, el token expiró o es inválido
      if (error.response.status === 401) {
        console.warn('⚠️ Token inválido o expirado. Redirigiendo a login...');
        // Opcional: redirigir a login
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('❌ No se recibió respuesta del servidor:', error.request);
    } else {
      // Error en la configuración de la petición
      console.error('❌ Error en la configuración:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// ADMIN SERVICE
// ============================================

export const adminService = {
  // Obtener todas las solicitudes de reprogramación pendientes
  getSolicitudesReprogramacion: async (): Promise<SolicitudReprogramacion[]> => {
    const response = await api.get('/admin/reprogramaciones/pendientes');
    return response.data;
  },

  // Obtener guías disponibles para asignar
  getGuiasDisponibles: async (fecha?: string, solicitudId?: string): Promise<GuiaDisponible[]> => {
    let url = '/admin/guias-disponibles';
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
    
    const response = await api.get(url);
    return response.data;
  },

  // Asignar un guía a una solicitud de reprogramación
  asignarGuia: async (solicitudId: string, guiaId: string): Promise<any> => {
    const response = await api.post(`/admin/reprogramaciones/${solicitudId}/completar`, {
      guiaId,
      fecha: new Date().toISOString()
    });
    return response.data;
  },

  // Crear un nuevo turno a partir de una solicitud de reprogramación
  crearTurnoReprogramado: async (solicitudId: string, guiaId: string, fechaProgramada?: string): Promise<any> => {
    const response = await api.post(`/admin/reprogramaciones/${solicitudId}/completar`, {
      guiaId,
      fecha: fechaProgramada || new Date().toISOString()
    });
    return response.data;
  },

  // Obtener turnos pendientes de asignación (primeros usuarios)
  getTurnosPendientesAsignacion: async (): Promise<TurnoPendiente[]> => {
    const response = await api.get('/admin/turnos-pendientes-asignacion');
    return response.data;
  },

  // Asignar guía a un turno pendiente
  asignarGuiaATurno: async (turnoId: string, guiaId: string): Promise<any> => {
    const response = await api.post(`/admin/turnos/${turnoId}/asignar-guia`, { guiaId });
    return response.data;
  },

  // Obtener lista de guías para filtros
  obtenerGuiasLista: async (): Promise<{ id: string; nombre: string; email: string }[]> => {
    const response = await api.get('/admin/guias-disponibles');
    return response.data;
  },

  // Obtener lista de usuarios para filtros
  obtenerUsuariosLista: async (): Promise<{ id: string; nombre: string; email: string }[]> => {
    const response = await api.get('/admin/usuarios/');
    return response.data;
  },
};

// ============================================
// OBTENER CARGA DE GUÍAS
// ============================================

export const getCargaGuias = async () => {
  try {
    const response = await api.get('/admin/carga-guias');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener carga de guías:', error);
    throw error;
  }
};