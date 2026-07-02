import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const emergenciaService = {
  activarEmergencia: async (turnoId: string, motivo?: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/emergencia/activar`,
      { turnoId, motivo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};