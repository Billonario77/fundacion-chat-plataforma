import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: 'usuario' | 'guia' | 'admin';
  disponible: boolean;
  datos_completados: boolean;
  created_at: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  foto_perfil?: string;
  cedula?: string;
  edad?: number;
  celular?: string;
  ciudad?: string;
  altura?: number;
  peso?: number;
  direccion?: string;
  tipo_adiccion?: string;
  observaciones?: string;
  rh?: string;
  sexo?: string;
  cto_emerg_nombre?: string;
  cto_emerg_celular?: string;
  cto_emerg_email?: string;
}

export interface Guia extends Usuario {
  especialidades?: string[];
  verificado?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const adminUsuariosService = {
  // Obtener todos los usuarios
  getUsuarios: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Usuario>> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/usuarios/`, {
      params: { page, limit, search },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obtener usuario por ID
  getUsuarioById: async (id: string): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Crear usuario
  crearUsuario: async (data: Partial<Usuario> & { password: string }): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/admin/usuarios/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Actualizar usuario
  actualizarUsuario: async (id: string, data: Partial<Usuario>): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/admin/usuarios/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cambiar rol de usuario
  cambiarRol: async (id: string, rol: string): Promise<Usuario> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/admin/usuarios/${id}/rol`, { rol }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Eliminar usuario
  eliminarUsuario: async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/admin/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};