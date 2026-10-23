import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';
import { AIService } from '../services/aiService';

const aiService = new AIService(pool);

// ============================================
// ENVIAR MENSAJE A ALMA
// ============================================
export const enviarMensaje = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { mensaje } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    if (mensaje.length > 2000) {
      return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' });
    }

    // Procesar con el servicio de IA
    const respuesta = await aiService.procesarMensaje(usuarioId, mensaje.trim());

    res.json({
      success: true,
      data: {
        respuesta,
      },
    });
  } catch (error: any) {
    console.error('Error al enviar mensaje a Alma:', error);
    res.status(500).json({ 
      error: error.message || 'Error al comunicarse con el guía de IA. Por favor, intenta de nuevo.' 
    });
  }
};

// ============================================
// OBTENER HISTORIAL DE CHAT
// ============================================
export const obtenerHistorialChat = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const historial = await aiService.obtenerHistorial(usuarioId);

    res.json({
      success: true,
      data: historial,
    });
  } catch (error: any) {
    console.error('Error al obtener historial de Alma:', error);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
};