import { Router } from 'express';
import { authenticateToken, requireGuia } from '../middleware/auth';
import * as turnosController from '../controllers/turnosController';

const router = Router();

// ============================================
// TURNOS
// ============================================

// Solicitar apoyo (usuario)
router.post('/solicitar', authenticateToken, turnosController.solicitarApoyo);

// Obtener turnos del guía
router.get('/mis-turnos', authenticateToken, requireGuia, turnosController.misTurnos);

// Obtener solicitudes del usuario
router.get('/mis-solicitudes', authenticateToken, turnosController.misSolicitudes);

// Obtener historial de turnos
router.get('/historial', authenticateToken, turnosController.getHistorialTurnos);

// Obtener turno por ID
router.get('/:turnoId', authenticateToken, turnosController.obtenerTurnoPorId);

// Actualizar estado del turno
router.patch('/:turnoId/estado', authenticateToken, turnosController.actualizarEstadoTurno);

// Cancelar turno
router.post('/:turnoId/cancelar', authenticateToken, turnosController.cancelarTurno);

// ============================================
// REPROGRAMACIONES
// ============================================

// Reprogramar turno (usuario)
router.post('/:turnoId/reprogramar', authenticateToken, turnosController.reprogramarTurno);

// Obtener reprogramaciones del usuario
router.get('/mis-reprogramaciones', authenticateToken, turnosController.getMisReprogramaciones);

// ============================================
// CANCELACIONES
// ============================================

// Marcar cancelaciones como vistas
router.post('/cancelaciones/marcar-vistas', authenticateToken, turnosController.marcarCancelacionesComoVistas);

// Contar cancelaciones no vistas
router.get('/cancelaciones/no-vistas/count', authenticateToken, turnosController.contarCancelacionesNoVistas);

// ============================================
// PERFIL
// ============================================

// Obtener mi guía actual
router.get('/mi-guia', authenticateToken, turnosController.getMiGuiaActual);

// Obtener mi perfil
router.get('/mi-perfil', authenticateToken, turnosController.getMiPerfil);

// 👈 CORREGIDO: actualizarMiFoto en lugar de actualizarFotoPerfil
router.put('/mi-foto', authenticateToken, turnosController.actualizarMiFoto);

// Completar mis datos
router.post('/completar-datos', authenticateToken, turnosController.completarMisDatos);

export default router;