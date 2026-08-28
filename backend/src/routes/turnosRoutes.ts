import { Router } from 'express';
import { authenticateToken, requireGuia } from '../middleware/auth';
import * as turnosController from '../controllers/turnosController';

const router = Router();

// ============================================
// 🔴 IMPORTANTE: Las rutas específicas VAN PRIMERO
// ============================================

// Obtener mi perfil
router.get('/mi-perfil', authenticateToken, turnosController.getMiPerfil);

// Actualizar foto de perfil
router.put('/mi-foto', authenticateToken, turnosController.actualizarMiFoto);

// Obtener mi guía actual
router.get('/mi-guia', authenticateToken, turnosController.getMiGuiaActual);

// ============================================
// REPROGRAMACIONES (rutas específicas)
// ============================================

// Obtener reprogramaciones del usuario
router.get('/mis-reprogramaciones', authenticateToken, turnosController.getMisReprogramaciones);

// ============================================
// CANCELACIONES (rutas específicas)
// ============================================

// Marcar cancelaciones como vistas
router.post('/cancelaciones/marcar-vistas', authenticateToken, turnosController.marcarCancelacionesComoVistas);

// Contar cancelaciones no vistas
router.get('/cancelaciones/no-vistas/count', authenticateToken, turnosController.contarCancelacionesNoVistas);

// ============================================
// TURNOS (rutas específicas)
// ============================================

// Solicitar apoyo (usuario)
router.post('/solicitar', authenticateToken, turnosController.solicitarApoyo);

// Obtener turnos del guía
router.get('/mis-turnos', authenticateToken, requireGuia, turnosController.misTurnos);

// Obtener solicitudes del usuario
router.get('/mis-solicitudes', authenticateToken, turnosController.misSolicitudes);

// Obtener historial de turnos
router.get('/historial', authenticateToken, turnosController.getHistorialTurnos);

// Reprogramar turno (usuario)
router.post('/:turnoId/reprogramar', authenticateToken, turnosController.reprogramarTurno);

// Actualizar estado del turno
router.patch('/:turnoId/estado', authenticateToken, turnosController.actualizarEstadoTurno);

// Cancelar turno
router.post('/:turnoId/cancelar', authenticateToken, turnosController.cancelarTurno);

// Completar mis datos
router.post('/completar-datos', authenticateToken, turnosController.completarMisDatos);

// ============================================
// 🔴 RUTA DINÁMICA - DEBE IR AL FINAL
// ============================================

// Obtener turno por ID (dinámica - va al final)
router.get('/:turnoId', authenticateToken, turnosController.obtenerTurnoPorId);

export default router;