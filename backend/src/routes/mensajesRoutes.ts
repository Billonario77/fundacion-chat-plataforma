import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as mensajesController from '../controllers/mensajesController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// 👈 RUTA CORRECTA: POST /
router.post('/', mensajesController.enviarMensaje);

// Obtener mensajes de un turno
router.get('/turno/:turnoId', mensajesController.getMensajesPorTurno);

// Marcar mensajes como leídos
router.put('/turno/:turnoId/leer', mensajesController.marcarComoLeidos);

// Obtener mensajes no leídos
router.get('/no-leidos', mensajesController.getMensajesNoLeidos);

// 👈 OPCIÓN: Si quieres mantener compatibilidad con /enviar
router.post('/enviar', mensajesController.enviarMensaje);

export default router;