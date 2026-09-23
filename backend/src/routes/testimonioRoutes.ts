
import { Router } from 'express';
import {
    getTestimoniosPublicos,
    crearTestimonio,
    getMisTestimonios,
    editarTestimonio,
    eliminarMiTestimonio,
    adminListarTestimonios,
    adminAprobarTestimonio,
    adminRechazarTestimonio,
    adminDestacarTestimonio,
    adminEliminarTestimonio,
} from '../controllers/testimonioController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/* ---------- Público ---------- */
router.get('/', getTestimoniosPublicos);

/* ---------- Usuario autenticado ---------- */
router.post('/',      authenticateToken, crearTestimonio);
router.get('/mios',   authenticateToken, getMisTestimonios);
router.put('/:id',    authenticateToken, editarTestimonio);
router.delete('/:id', authenticateToken, eliminarMiTestimonio);

/* ---------- Admin ---------- */
router.get('/admin/todos',           authenticateToken, requireAdmin, adminListarTestimonios);
router.patch('/admin/:id/aprobar',   authenticateToken, requireAdmin, adminAprobarTestimonio);
router.patch('/admin/:id/rechazar',  authenticateToken, requireAdmin, adminRechazarTestimonio);
router.patch('/admin/:id/destacar',  authenticateToken, requireAdmin, adminDestacarTestimonio);
router.delete('/admin/:id',          authenticateToken, requireAdmin, adminEliminarTestimonio);

export default router;