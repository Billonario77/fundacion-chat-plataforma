import axios from 'axios';

const API_URL = 'https://fundacion-chat-plataforma-backend-api.onrender.com/api';

export interface Configuracion {
  precio_sesion: string;
  meta_mensual_donaciones: string;
  duracion_sesion_minutos: string;
  [key: string]: string;
}

// Cache en memoria para no pedir la config en cada render
let configCache: Configuracion | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const configuracionService = {
  /**
   * Obtener toda la configuración (con cache de 5 min)
   */
  obtenerConfiguracion: async (forzarRecarga = false): Promise<Configuracion> => {
    const ahora = Date.now();
    
    // Si hay cache y no ha expirado, devolver cache
    if (!forzarRecarga && configCache && (ahora - cacheTimestamp) < CACHE_DURATION) {
      return configCache;
    }

    try {
      const response = await axios.get(`${API_URL}/configuracion`);
      configCache = response.data.data;
      cacheTimestamp = ahora;
      return configCache!;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      // Fallback con valores por defecto si falla la API
      return {
        precio_sesion: '100000',
        meta_mensual_donaciones: '5000000',
        duracion_sesion_minutos: '60'
      };
    }
  },

  /**
   * Obtener un valor específico de la configuración
   */
  obtenerValor: async (clave: string, defaultValue: string = ''): Promise<string> => {
    const config = await configuracionService.obtenerConfiguracion();
    return config[clave] || defaultValue;
  },

  /**
   * Obtener el precio de la sesión como número
   */
  obtenerPrecioSesion: async (): Promise<number> => {
    const valor = await configuracionService.obtenerValor('precio_sesion', '100000');
    return parseInt(valor) || 100000;
  },

  /**
   * Limpiar el cache (útil cuando el admin cambia un valor)
   */
  limpiarCache: () => {
    configCache = null;
    cacheTimestamp = 0;
  },

    /**
   * Actualizar un valor de configuración (solo admin)
   */
  actualizarValor: async (clave: string, valor: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/configuracion`,
        { clave, valor },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Limpiar cache para forzar recarga
      configuracionService.limpiarCache();
      
      return response.data.success;
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  },

  /**
   * Obtener toda la configuración con descripciones (admin)
   */
  obtenerConfiguracionCompleta: async (): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/configuracion`);
    const config = response.data.data;
    
    // Convertir a array con descripciones
    const descripciones: Record<string, string> = {
      precio_sesion: 'Precio de una sesión de 1 hora en COP',
      meta_mensual_donaciones: 'Meta mensual de donaciones en COP',
      duracion_sesion_minutos: 'Duración de una sesión en minutos'
    };

    return Object.entries(config).map(([clave, valor]) => ({
      clave,
      valor,
      descripcion: descripciones[clave] || ''
    }));
  }
};