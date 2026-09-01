import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// ============================================
// RUTAS PARA GUÍAS (sin requireAdmin)
// ============================================

// Obtener carga del guía autenticado (solo guías)
router.get('/mi-carga-guia', authenticateToken, (req: AuthRequest, res, next) => {
  // Verificar que sea guía
  if (req.user?.rol !== 'guia') {
    return res.status(403).json({ error: 'Acceso solo para guías' });
  }
  next();
}, adminController.getMiCarga);

// ============================================
// RUTAS PARA ADMINISTRADORES (con requireAdmin)
// ============================================

// Todas las rutas a partir de aquí requieren rol admin
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// GUÍAS
// ============================================

// Obtener guías disponibles
router.get('/guias-disponibles', adminController.getGuiasDisponibles);

// Obtener guías con usuarios asignados
router.get('/asignaciones/guias-con-usuarios', adminController.getGuiasConUsuarios);

// Obtener carga de guías (solo admin)
router.get('/carga-guias', adminController.getCargaGuias);

// Obtener carga de un guía específico (solo admin)
router.get('/mi-carga', adminController.getMiCarga);

// ============================================
// TURNOS
// ============================================

// Obtener turnos pendientes de asignación
router.get('/turnos-pendientes-asignacion', adminController.getTurnosPendientesAsignacion);

// Asignar guía a turno
router.post('/turnos/:turnoId/asignar-guia', adminController.asignarGuiaATurno);

// Crear turno reprogramado
router.post('/reprogramaciones/:solicitudId/completar', adminController.crearTurnoReprogramado);

// ============================================
// REPROGRAMACIONES
// ============================================

// Contar reprogramaciones pendientes
router.get('/reprogramaciones/pendientes/count', adminController.countReprogramacionesPendientes);

// Obtener reprogramaciones pendientes
router.get('/reprogramaciones/pendientes', adminController.getReprogramacionesPendientes);

// ============================================
// USUARIOS CON GUÍA (para búsqueda)
// ============================================

router.get('/usuarios-con-guia', adminController.getUsuariosConGuia);

export default router;