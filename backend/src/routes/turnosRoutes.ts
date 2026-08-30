import { Router } from 'express';
import { authenticateToken, requireGuia } from '../middleware/auth';
import * as turnosController from '../controllers/turnosController';

const router = Router();

// ============================================
// 🔴 IMPORTANTE: Las rutas específicas VAN PRIMERO
// ============================================

// ============================================
// PERFIL (rutas específicas - van primero)
// ============================================

router.get('/mi-perfil', authenticateToken, turnosController.getMiPerfil);
router.put('/mi-foto', authenticateToken, turnosController.actualizarMiFoto);
router.get('/mi-guia', authenticateToken, turnosController.getMiGuiaActual);

// ============================================
// REPROGRAMACIONES (rutas específicas)
// ============================================

router.get('/mis-reprogramaciones', authenticateToken, turnosController.getMisReprogramaciones);

// ============================================
// CANCELACIONES (rutas específicas - ANTES de la ruta dinámica)
// ============================================

router.post('/cancelaciones/marcar-vistas', authenticateToken, turnosController.marcarCancelacionesComoVistas);
router.get('/cancelaciones/no-vistas/count', authenticateToken, turnosController.contarCancelacionesNoVistas);
router.get('/cancelaciones/admin', authenticateToken, turnosController.obtenerCancelacionesAdmin);
router.get('/cancelaciones/metricas', authenticateToken, turnosController.obtenerMetricasCancelaciones);

// ============================================
// HISTORIAL ADMIN (rutas específicas)
// ============================================

router.get('/historial/admin', authenticateToken, turnosController.getHistorialAdmin);

// ============================================
// TURNOS (rutas específicas)
// ============================================

router.post('/solicitar', authenticateToken, turnosController.solicitarApoyo);
router.get('/mis-turnos', authenticateToken, requireGuia, turnosController.misTurnos);
router.get('/mis-solicitudes', authenticateToken, turnosController.misSolicitudes);
router.get('/historial', authenticateToken, turnosController.getHistorialTurnos);
router.post('/:turnoId/reprogramar', authenticateToken, turnosController.reprogramarTurno);
router.patch('/:turnoId/estado', authenticateToken, turnosController.actualizarEstadoTurno);
router.post('/:turnoId/cancelar', authenticateToken, turnosController.cancelarTurno);
router.post('/completar-datos', authenticateToken, turnosController.completarMisDatos);

// ============================================
// 🔴 RUTA DINÁMICA - DEBE IR AL FINAL
// ============================================

router.get('/:turnoId', authenticateToken, turnosController.obtenerTurnoPorId);

export default router;