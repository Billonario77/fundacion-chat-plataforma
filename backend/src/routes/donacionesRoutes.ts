import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import {
  generarFirmaDonacion,
  webhookWompi,
  obtenerDonaciones,
  obtenerEstadisticasDonaciones,
  obtenerDonacionPorReferencia
} from '../controllers/donacionesController';

const router = Router();

// ============================================
// RUTAS DE DONACIONES
// ============================================

// Generar firma de integridad (público - no requiere autenticación)
router.post('/generar-firma', generarFirmaDonacion);

// Webhook de Wompi (público - no requiere autenticación, validamos con firma)
router.post('/webhook', webhookWompi);

// Obtener donación por referencia (público)
router.get('/:referencia', obtenerDonacionPorReferencia);

// Obtener todas las donaciones (solo admin)
router.get('/', authenticateToken, isAdmin, obtenerDonaciones);

// Estadísticas de donaciones (solo admin)
router.get('/admin/estadisticas', authenticateToken, isAdmin, obtenerEstadisticasDonaciones);

export default router;