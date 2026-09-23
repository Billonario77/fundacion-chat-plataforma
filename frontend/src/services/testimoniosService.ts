// frontend/src/services/testimoniosService.ts
import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

/* =========================================================
   TIPOS
   ========================================================= */

export type EstadoTestimonio = 'pendiente' | 'aprobado' | 'rechazado';

export interface Testimonio {
  id: number;
  contenido: string;
  calificacion: number;
  estado: EstadoTestimonio;
  motivo_rechazo: string | null;
  destacado: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface TestimonioPublico {
  id: number;
  contenido: string;
  calificacion: number;
  destacado: boolean;
  creado_en: string;
  autor: string;
  es_anonimo: boolean;
}

export interface TestimonioAdmin extends Testimonio {
  usuario_id: string;
  email: string;
  nombre: string | null;
  nickname: string | null;
  es_anonimo: boolean;
  moderador_email: string | null;
}

export interface RespuestaPaginada<T> {
  testimonios: T[];
  total: number;
  page: number;
  totalPages: number;
}

/* =========================================================
   SERVICIO
   ========================================================= */

const token = () => localStorage.getItem('token');

export const testimoniosService = {
  /* ---------- Público ---------- */

  listarPublicos: async (params?: {
    page?: number;
    limit?: number;
    calificacion?: number;
  }): Promise<RespuestaPaginada<TestimonioPublico>> => {
    const response = await axios.get(`${API_URL}/testimonios`, { params });
    return response.data;
  },

  /* ---------- Usuario autenticado ---------- */

  crear: async (data: {
    contenido: string;
    calificacion: number;
  }): Promise<{ mensaje: string; testimonio: Testimonio }> => {
    const response = await axios.post(`${API_URL}/testimonios`, data, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },

  misTestimonios: async (): Promise<{ testimonios: Testimonio[] }> => {
    const response = await axios.get(`${API_URL}/testimonios/mios`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },

  editar: async (
    id: number,
    data: { contenido: string; calificacion: number }
  ): Promise<{ mensaje: string; testimonio: Testimonio }> => {
    const response = await axios.put(`${API_URL}/testimonios/${id}`, data, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },

  eliminar: async (id: number): Promise<{ mensaje: string }> => {
    const response = await axios.delete(`${API_URL}/testimonios/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },

  /* ---------- Admin ---------- */

  adminListar: async (params?: {
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<RespuestaPaginada<TestimonioAdmin>> => {
    const response = await axios.get(`${API_URL}/testimonios/admin/todos`, {
      params,
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },

  adminAprobar: async (id: number): Promise<{ mensaje: string; testimonio: Testimonio }> => {
    const response = await axios.patch(
      `${API_URL}/testimonios/admin/${id}/aprobar`,
      {},
      { headers: { Authorization: `Bearer ${token()}` } }
    );
    return response.data;
  },

  adminRechazar: async (
    id: number,
    motivo: string
  ): Promise<{ mensaje: string; testimonio: Testimonio }> => {
    const response = await axios.patch(
      `${API_URL}/testimonios/admin/${id}/rechazar`,
      { motivo },
      { headers: { Authorization: `Bearer ${token()}` } }
    );
    return response.data;
  },

  adminDestacar: async (id: number): Promise<{ mensaje: string; testimonio: Testimonio }> => {
    const response = await axios.patch(
      `${API_URL}/testimonios/admin/${id}/destacar`,
      {},
      { headers: { Authorization: `Bearer ${token()}` } }
    );
    return response.data;
  },

  adminEliminar: async (id: number): Promise<{ mensaje: string }> => {
    const response = await axios.delete(`${API_URL}/testimonios/admin/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  },
};