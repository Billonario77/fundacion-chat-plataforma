import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  enviarMensaje,
  obtenerHistorialChat,
} from '../controllers/aiController';

const router = Router();

// Enviar un mensaje a Alma (Guía de IA)
router.post('/mensaje', authenticateToken, enviarMensaje);

// Obtener el historial de chat del usuario
router.get('/historial', authenticateToken, obtenerHistorialChat);

export default router;