// backend/src/routes/mensajesRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as mensajesController from '../controllers/mensajesController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Enviar mensaje
router.post('/', mensajesController.enviarMensaje);

// Obtener mensajes de un turno
router.get('/turno/:turnoId', mensajesController.getMensajesPorTurno);

// Marcar mensajes como leídos
router.put('/turno/:turnoId/leer', mensajesController.marcarComoLeidos);

// Obtener mensajes no leídos - PERMITIR A TODOS LOS ROLES
router.get('/no-leidos', mensajesController.getMensajesNoLeidos);

export default router;