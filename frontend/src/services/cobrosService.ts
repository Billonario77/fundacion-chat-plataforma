import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// ============================================
// INTERFACES
// ============================================

export interface Entidad {
  id: string;
  nombre: string;
  tipo: 'empresa' | 'ong' | 'gobierno';
  identificador?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
  descuento_porcentaje: number;
  bolsa_horas_inicial: number;
  bolsa_horas_restantes: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cupon {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: 'porcentaje' | 'fijo' | 'gratis';
  valor: number;
  entidad_id?: string;
  aplica_a: 'nuevos' | 'antiguos' | 'todos';
  fecha_inicio?: string;
  fecha_expiracion?: string;
  usos_maximos: number;
  usos_actuales: number;
  activo: boolean;
  created_at: string;
}

export interface Cobro {
  id: string;
  turno_id: string;
  usuario_id: string;
  guia_id: string;
  entidad_id?: string;
  duracion_minutos: number;
  costo_por_hora: number;
  descuento_porcentaje: number;
  descuento_aplicado: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'fallido' | 'exento' | 'consumido_bolsa';
  metodo_pago?: string;
  comprobante_url?: string;
  pagado_at?: string;
  created_at: string;
}

export interface ResumenEntidad {
  entidad: Entidad;
  usuarios: any[];
  consumo_total: number;
  horas_restantes: number;
}

// ============================================
// SERVICIO DE COBROS
// ============================================

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  }
});

export const cobrosService = {
  // ============================================
  // ENTIDADES
  // ============================================

  // Crear entidad (admin)
  crearEntidad: async (data: {
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    identificador?: string;
    contactoNombre?: string;
    contactoEmail?: string;
    contactoTelefono?: string;
    descuentoPorcentaje?: number;
    bolsaHorasInicial?: number;
  }) => {
    const response = await axios.post(`${API_URL}/cobros/entidades`, data, headers());
    return response.data;
  },

  // Obtener todas las entidades (admin)
  obtenerEntidades: async (): Promise<Entidad[]> => {
    const response = await axios.get(`${API_URL}/cobros/entidades`, headers());
    return response.data.data;
  },

  // Obtener resumen de entidad (admin)
  obtenerResumenEntidad: async (entidadId: string): Promise<ResumenEntidad> => {
    const response = await axios.get(`${API_URL}/cobros/entidades/${entidadId}/resumen`, headers());
    return response.data.data;
  },

  // Asignar usuario a entidad (admin)
  asignarUsuarioAEntidad: async (usuarioId: string, entidadId: string) => {
    const response = await axios.post(`${API_URL}/cobros/usuarios/asignar-entidad`, {
      usuarioId,
      entidadId
    }, headers());
    return response.data;
  },

  // Marcar usuario como exento (admin)
  marcarUsuarioExento: async (usuarioId: string, motivo: string) => {
    const response = await axios.post(`${API_URL}/cobros/usuarios/marcar-exento`, {
      usuarioId,
      motivo
    }, headers());
    return response.data;
  },

  // ============================================
  // CUPONES
  // ============================================

  // Crear cupón (admin)
  crearCupon: async (data: {
    descripcion: string;
    tipo: 'porcentaje' | 'fijo' | 'gratis';
    valor: number;
    entidadId?: string;
    aplicaA?: 'nuevos' | 'antiguos' | 'todos';
    fechaInicio?: string;
    fechaExpiracion?: string;
    usosMaximos?: number;
  }) => {
    const response = await axios.post(`${API_URL}/cobros/cupones`, data, headers());
    return response.data;
  },

  // Validar cupón
  validarCupon: async (codigo: string) => {
    const response = await axios.get(`${API_URL}/cobros/cupones/validar/${codigo}`, headers());
    return response.data;
  },

  // ============================================
  // COBROS
  // ============================================

  // Calcular costo de un turno
  calcularCosto: async (turnoId: string, codigoCupon?: string) => {
    const response = await axios.post(`${API_URL}/cobros/turnos/${turnoId}/calcular-costo`, {
      codigoCupon
    }, headers());
    return response.data;
  },

  // Verificar estado de pago
  verificarPago: async (turnoId: string) => {
    const response = await axios.get(`${API_URL}/cobros/turnos/${turnoId}/verificar-pago`, headers());
    return response.data;
  },

  // Registrar pago manual (admin)
  registrarPagoManual: async (data: {
    turnoId: string;
    metodoPago: string;
    comprobanteUrl?: string;
  }) => {
    const response = await axios.post(`${API_URL}/cobros/registrar-pago-manual`, data, headers());
    return response.data;
  },

  // Obtener estadísticas de cobros (admin)
  obtenerEstadisticas: async () => {
    const response = await axios.get(`${API_URL}/cobros/estadisticas`, headers());
    return response.data;
  },

  // Obtener cobro por turno
  obtenerCobroPorTurno: async (turnoId: string) => {
    const response = await axios.get(`${API_URL}/cobros/turnos/${turnoId}/cobro`, headers());
    return response.data;
  }
};