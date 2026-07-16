import axios from 'axios';

const API_URL = 'https://fundacion-chat-backend-api.onrender.com/api/admin/usuarios';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'usuario' | 'guia' | 'admin';
  activo: boolean;
  created_at: string;
}

export interface Guia {
  id: string;
  email: string;
  nombre: string;
  disponible: boolean;
  created_at: string;
}

export const adminUsuariosService = {
  // Obtener todos los usuarios
  getUsuarios: async (): Promise<Usuario[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener todos los guías
  getGuias: async (): Promise<Guia[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/guias`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Activar/desactivar usuario
  toggleUsuarioEstado: async (usuarioId: string): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/usuarios/${usuarioId}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cambiar disponibilidad de guía
  toggleGuiaDisponibilidad: async (guiaId: string): Promise<Guia> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/guias/${guiaId}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Actualizar rol de usuario
  actualizarRol: async (usuarioId: string, rol: string): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/usuarios/${usuarioId}/rol`, 
      { usuarioId, rol },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Obtener usuario por ID (para editar)
  getUsuarioById: async (usuarioId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/usuarios/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Actualizar perfil de usuario
  actualizarPerfil: async (usuarioId: string, datos: any): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/usuarios/${usuarioId}`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};