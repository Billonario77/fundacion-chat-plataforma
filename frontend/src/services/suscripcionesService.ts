import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// ============================================
// TIPOS
// ============================================

export interface PlanDisponible {
  id: 'bienestar' | 'refugio' | 'santuario';
  nombre: string;
  sesiones: number;
  precio: number;
}

export interface PlanActivo {
  id: string;
  plan: 'bienestar' | 'refugio' | 'santuario';
  sesionesIncluidas: number;
  sesionesUsadas: number;
  sesionesRestantes: number;
  fechaInicio: string;
  fechaFin: string;
  diasRestantes: number;
}

export interface IniciarPagoResponse {
  suscripcionId: string;
  plan: string;
  sesionesIncluidas: number;
  precioPlan: number;
  multasPendientes: number;
  precioTotal: number;
  referencia: string;
  montoEnCentavos: number;
  firmaIntegridad: string;
  publicKey: string;
  moneda: string;
}

// ============================================
// SERVICIO
// ============================================

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

export const suscripcionesService = {
  /**
   * Obtiene los 3 planes disponibles + el monto de multas pendientes del usuario.
   */
  listarPlanes: async (): Promise<{ planes: PlanDisponible[]; multasPendientes: number }> => {
    const response = await axios.get(`${API_URL}/suscripciones/planes`, headers());
    return response.data.data;
  },

  /**
   * Devuelve el plan activo del usuario, o null si no tiene.
   */
  miPlan: async (): Promise<PlanActivo | null> => {
    const response = await axios.get(`${API_URL}/suscripciones/mi-plan`, headers());
    return response.data.data;
  },

  /**
   * Historial de suscripciones del usuario.
   */
  historial: async (): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/suscripciones/historial`, headers());
    return response.data.data;
  },

  /**
   * Inicia el pago de un plan. Devuelve la firma Wompi para abrir el widget.
   */
  iniciarPago: async (plan: 'bienestar' | 'refugio' | 'santuario'): Promise<IniciarPagoResponse> => {
    const response = await axios.post(
      `${API_URL}/suscripciones/iniciar-pago`,
      { plan },
      headers()
    );
    return response.data.data;
  },
};