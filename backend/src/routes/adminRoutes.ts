import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
// Importamos solo lo que existe
// Si no existen estas funciones, las comentamos o las quitamos

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authMiddleware);

// ============================================
// GUÍAS
// ============================================

// Obtener guías disponibles
router.get('/guias-disponibles', adminController.getGuiasDisponibles);

// Obtener guías con usuarios asignados
router.get('/asignaciones/guias-con-usuarios', adminController.getGuiasConUsuarios);

// Obtener carga de guías (NUEVO)
router.get('/carga-guias', adminController.getCargaGuias);

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