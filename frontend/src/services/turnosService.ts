import axios from 'axios';

//const API_URL = 'http://localhost:3001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Turno {
  id: string;
  fecha_programada: string;
  duracion_minutos: number;
  modalidad: 'video' | 'audio' | 'chat';
  estado: 'pendiente' | 'aceptado' | 'iniciado' | 'completado' | 'cancelado';
  created_at: string;
  usuario_nombre?: string;
  usuario_email?: string;
  guia_nombre?: string;
  guia_email?: string;
  motivo_cancelacion?: string;
  cancelado_por?: 'usuario' | 'guia' | 'admin';
  es_reprogramacion?: boolean;
}

export interface TurnoDetalle extends Turno {
  recordatorios: {
    enviado_24h: boolean;
    enviado_1h: boolean;
  };
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  guia: {
    id: string;
    nombre: string;
  } | null;
  hora_inicio?: string;
}

export interface HistorialResponse {
  data: Turno[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const turnosService = {
  // Obtener turnos del guía autenticado
  getMisTurnos: async (): Promise<{ total: number; turnos: Turno[] }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/mis-turnos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener detalle de un turno específico
  getTurnoDetalle: async (turnoId: string): Promise<{ turno: TurnoDetalle }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/${turnoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Actualizar estado de un turno
  actualizarEstado: async (turnoId: string, estado: string, motivo?: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/turnos/${turnoId}/estado`,
      { estado, motivo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener historial de turnos con paginación
  getHistorialTurnos: async (page: number = 1, limit: number = 10): Promise<HistorialResponse> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/historial?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cancelar un turno
  cancelarTurno: async (turnoId: string, motivo?: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/turnos/${turnoId}/cancelar`,
      { motivo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Reprogramar un turno cancelado
  reprogramarTurno: async (
    turnoId: string,
    preferencia?: string,
    fecha_preferida?: string,
    comentarios?: string
  ): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/turnos/${turnoId}/reprogramar`,
      { preferencia, fecha_preferida, comentarios },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Marcar cancelaciones como vistas
  marcarCancelacionesVistas: async (): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/turnos/marcar-cancelaciones-vistas`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Verificar si hay cancelaciones no vistas
  verificarCancelacionesNoVistas: async (): Promise<{ hayNoVistas: boolean }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/turnos/cancelaciones-no-vistas`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Contar cancelaciones no vistas
  contarCancelacionesNoVistas: async (): Promise<{ count: number }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/turnos/cancelaciones-no-vistas/count`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener cancelaciones para admin (con filtros)
  obtenerCancelacionesAdmin: async (filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cancelado_por?: string;
    guia_id?: string;
    usuario_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; pagination: any }> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();

    if (filtros?.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros?.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros?.cancelado_por) params.append('cancelado_por', filtros.cancelado_por);
    if (filtros?.guia_id) params.append('guia_id', filtros.guia_id);
    if (filtros?.usuario_id) params.append('usuario_id', filtros.usuario_id);
    if (filtros?.page) params.append('page', String(filtros.page));
    if (filtros?.limit) params.append('limit', String(filtros.limit));

    const response = await axios.get(
      `${API_URL}/turnos/admin/cancelaciones?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener métricas de cancelaciones para admin
  obtenerMetricasCancelaciones: async (): Promise<{
    total: number;
    porRol: { cancelado_por: string; count: number }[];
    topGuias: { nombre: string; count: number }[];
    topUsuarios: { nombre: string; count: number }[];
  }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/turnos/admin/cancelaciones/metricas`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener historial para admin (con filtros)
  getHistorialAdmin: async (filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
    usuario_id?: string;
    guia_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; pagination: any }> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();

    if (filtros?.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros?.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.usuario_id) params.append('usuario_id', filtros.usuario_id);
    if (filtros?.guia_id) params.append('guia_id', filtros.guia_id);
    if (filtros?.page) params.append('page', String(filtros.page));
    if (filtros?.limit) params.append('limit', String(filtros.limit));

    const response = await axios.get(
      `${API_URL}/turnos/admin/historial?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

// Servicio para usuarios
export const usuarioService = {
  // Obtener solicitudes del usuario autenticado
  getMisSolicitudes: async (): Promise<{ total: number; turnos: Turno[] }> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/mis-solicitudes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Solicitar nuevo apoyo
  solicitarApoyo: async (rol: string, mensajeInicial: string, fechaPreferida?: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/turnos/solicitar`, 
      { rol, mensajeInicial, fechaPreferida },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Reprogramar un turno cancelado
  reprogramarTurno: async (
    turnoId: string,
    preferencia?: string,
    fecha_preferida?: string,
    comentarios?: string
  ): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/turnos/${turnoId}/reprogramar`,
      { preferencia, fecha_preferida, comentarios },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener guía actual del usuario
  getMiGuiaActual: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/mi-guia-actual`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener perfil del usuario autenticado (foto, nombre, email)
  getMiPerfil: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/mi-perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },


  completarMisDatos: async (datos: any) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/turnos/completar-datos`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  actualizarMiFoto: async (foto_perfil: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/turnos/mi-foto`, { foto_perfil }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};


// Servicio común para cualquier rol (usuario, guía, admin)
export const perfilService = {
  getMiPerfil: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/turnos/mi-perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};