import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface DonacionResponse {
  referencia: string;
  montoEnCentavos: number;
  firmaIntegridad: string;
  publicKey: string;
  moneda: string;
  donacionId: string;
}

export const donacionesService = {
  /**
   * Generar firma de integridad para el Widget de Wompi
   */
  generarFirma: async (data: {
    monto: number;
    nombreDonante?: string;
    emailDonante?: string;
    esAnonima?: boolean;
    mensaje?: string;
  }): Promise<DonacionResponse> => {
    const response = await axios.post(`${API_URL}/donaciones/generar-firma`, data);
    return response.data.data;
  },

  /**
   * Obtener donación por referencia
   */
  obtenerPorReferencia: async (referencia: string) => {
    const response = await axios.get(`${API_URL}/donaciones/${referencia}`);
    return response.data.data;
  }
};