import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as mensajesController from '../controllers/mensajesController';

const router = Router();

// Enviar mensaje
router.post('/', authenticateToken, mensajesController.enviarMensaje);

// Obtener mensajes de un turno
router.get('/turno/:turnoId', authenticateToken, mensajesController.getMensajesPorTurno);

// Marcar mensajes como leídos
router.put('/turno/:turnoId/leer', authenticateToken, mensajesController.marcarComoLeidos);

// Obtener mensajes no leídos
router.get('/no-leidos', authenticateToken, mensajesController.getMensajesNoLeidos);

export default router;