// @ts-nocheck
import AgoraRTC from "agora-rtc-react";

export interface AgoraConfig {
  appId: string;
  channel: string;
  token: string | null;
  uid?: number;
}

// Usar variable global de window
declare global {
  interface Window {
    VITE_AGORA_APP_ID: string;
  }
}

// Inicializar cliente de Agora
export const createAgoraClient = () => {
  return AgoraRTC.createClient({ 
    codec: "vp8", 
    mode: "rtc" 
  });
};

// Obtener token desde el backend
export const getAgoraToken = async (channelName: string, uid?: number): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://fundacion-chat-plataforma-backend-api.onrender.com/api/agora/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ channelName, uid })
    });
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error obteniendo token de Agora:', error);
    return null;
  }
};

// App ID desde variable de entorno global
export const appId = window.VITE_AGORA_APP_ID || '';
