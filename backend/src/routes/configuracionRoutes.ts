import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  obtenerConfiguracion,
  obtenerConfiguracionPorClave,
  actualizarConfiguracion
} from '../controllers/configuracionController';

const router = Router();

// Obtener toda la configuración (público)
router.get('/', obtenerConfiguracion);

// Obtener configuración específica (público)
router.get('/:clave', obtenerConfiguracionPorClave);

// Actualizar configuración (solo admin)
router.put('/', authenticateToken, actualizarConfiguracion);

export default router;