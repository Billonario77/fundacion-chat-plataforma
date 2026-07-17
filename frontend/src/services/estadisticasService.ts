import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

// Actualizamos la interfaz para que coincida con la nueva respuesta del backend
export interface Estadisticas {
  fechas: {
    inicio: string;
    fin: string;
  };
  totales: {
    usuarios: number;
    guias: number;
    turnos: number;
  };
  turnosPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
  turnosPorDia: Array<{
    fecha: string;
    cantidad: number;
  }>;
  guiasMasActivos: Array<{
    id: number;
    nombre: string;
    email: string;
    totalTurnos: number;
  }>;
  turnosReprogramados: {
      total: number;
      porEstado: Array<{
        estado: string;
        cantidad: number;
      }>;
  };
}

// Mantenemos la interfaz anterior para compatibilidad? 
// Mejor la eliminamos y usamos la nueva, pero como puede haber otros componentes
// que aún esperen la estructura antigua, por ahora creamos una nueva interfaz
// y luego en el dashboard haremos la adaptación

export interface EstadisticasAntiguas {
  general: {
    totalUsuarios: number;
    totalGuias: number;
    totalTurnos: number;
  };
  estados?: {
    completados: number;
    cancelados: number;
    enCurso: number;
    detalle: Array<{ estado: string; cantidad: number }>;
  };
  guiasActivos?: Array<{
    id: string;
    nombre: string;
    email: string;
    total_turnos: number;
  }>;
  turnosPorDia?: Array<{
    fecha: string;
    cantidad: number;
  }>;
}

export const estadisticasService = {
  // Obtener estadísticas con filtro opcional de fechas
  getEstadisticas: async (fechaInicio?: string, fechaFin?: string): Promise<Estadisticas> => {
  const token = localStorage.getItem('token');
  console.log('🔑 [Service] Token:', token ? 'Presente' : 'No hay token');
  
  let url = `${API_URL}/estadisticas`;
  const params = new URLSearchParams();
  
  // Agregar un parámetro timestamp para evitar caché
  params.append('_t', Date.now().toString());
  
  if (fechaInicio) {
    params.append('fechaInicio', fechaInicio);
  }
  if (fechaFin) {
    params.append('fechaFin', fechaFin);
  }
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  console.log('📡 [Service] URL:', url);
  
  try {
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('✅ [Service] Respuesta status:', response.status);
    console.log('✅ [Service] Respuesta data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [Service] Error en petición:', error);
    throw error;
  }
},
  
  // Mantenemos el método original para compatibilidad temporal
  // mientras migramos los componentes
  getEstadisticasAntiguas: async (): Promise<EstadisticasAntiguas> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/estadisticas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};



// Exportamos también un tipo auxiliar para los filtros
export interface FiltrosEstadisticas {
  fechaInicio?: string;
  fechaFin?: string;
}
