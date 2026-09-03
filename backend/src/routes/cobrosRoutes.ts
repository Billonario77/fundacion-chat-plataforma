import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import {
  calcularCostoTurno,
  verificarPagoTurno,
  confirmarPago,
  registrarPagoManual,
  obtenerCobroPorTurno,
  obtenerEstadisticasCobros,
  crearEntidad,
  crearCupon,
  validarCupon,
  obtenerEntidades,
  obtenerResumenEntidad,
  asignarUsuarioAEntidad,
  marcarUsuarioExento
} from '../controllers/cobrosController';

const router = Router();

// ============================================
// RUTAS DE COBROS
// ============================================

// Calcular costo de un turno
router.post('/turnos/:turnoId/calcular-costo', authenticateToken, calcularCostoTurno);

// Verificar estado de pago de un turno
router.get('/turnos/:turnoId/verificar-pago', authenticateToken, verificarPagoTurno);

// Confirmar pago (webhook o admin)
router.post('/confirmar-pago', authenticateToken, confirmarPago);

// Registrar pago manual (solo admin)
router.post('/registrar-pago-manual', authenticateToken, isAdmin, registrarPagoManual);

// Obtener cobro por turno
router.get('/turnos/:turnoId/cobro', authenticateToken, obtenerCobroPorTurno);

// Estadísticas de cobros (solo admin)
router.get('/estadisticas', authenticateToken, isAdmin, obtenerEstadisticasCobros);

// ============================================
// RUTAS DE ENTIDADES
// ============================================

// Crear entidad (solo admin)
router.post('/entidades', authenticateToken, isAdmin, crearEntidad);

// Obtener todas las entidades (solo admin)
router.get('/entidades', authenticateToken, isAdmin, obtenerEntidades);

// Obtener resumen de entidad (solo admin)
router.get('/entidades/:entidadId/resumen', authenticateToken, isAdmin, obtenerResumenEntidad);

// Asignar usuario a entidad (solo admin)
router.post('/usuarios/asignar-entidad', authenticateToken, isAdmin, asignarUsuarioAEntidad);

// Marcar usuario como exento (solo admin)
router.post('/usuarios/marcar-exento', authenticateToken, isAdmin, marcarUsuarioExento);

// ============================================
// RUTAS DE CUPONES
// ============================================

// Crear cupón (solo admin)
router.post('/cupones', authenticateToken, isAdmin, crearCupon);

// Validar cupón
router.get('/cupones/validar/:codigo', authenticateToken, validarCupon);

export default router;