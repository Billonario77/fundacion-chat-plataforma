import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  listarPlanes,
  iniciarPago,
  miPlan,
  historial,
} from '../controllers/suscripcionesController';

const router = Router();

// Listar planes disponibles y multas pendientes del usuario
router.get('/planes', authenticateToken, listarPlanes);

// Iniciar pago de una suscripción (retorna firma Wompi)
router.post('/iniciar-pago', authenticateToken, iniciarPago);

// Ver mi plan activo
router.get('/mi-plan', authenticateToken, miPlan);

// Historial de suscripciones del usuario
router.get('/historial', authenticateToken, historial);

export default router;