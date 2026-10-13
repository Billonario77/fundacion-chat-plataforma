import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  listarPlanes,
  iniciarPago,
  miPlan,
  historial,
  confirmarSuscripcionManual,
} from '../controllers/suscripcionesController';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

// Listar planes disponibles y multas pendientes del usuario
router.get('/planes', authenticateToken, listarPlanes);

// Iniciar pago de una suscripción (retorna firma Wompi)
router.post('/iniciar-pago', authenticateToken, iniciarPago);

// Ver mi plan activo
router.get('/mi-plan', authenticateToken, miPlan);

// Historial de suscripciones del usuario
router.get('/historial', authenticateToken, historial);

// Confirmar suscripción manualmente (solo admin — respaldo del webhook)
router.post('/admin/confirmar/:referencia', authenticateToken, isAdmin, confirmarSuscripcionManual);

export default router;