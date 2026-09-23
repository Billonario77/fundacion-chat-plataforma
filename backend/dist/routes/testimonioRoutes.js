"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonioController_1 = require("../controllers/testimonioController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', testimonioController_1.getTestimoniosPublicos);
router.post('/', auth_1.authenticateToken, testimonioController_1.crearTestimonio);
router.get('/mios', auth_1.authenticateToken, testimonioController_1.getMisTestimonios);
router.put('/:id', auth_1.authenticateToken, testimonioController_1.editarTestimonio);
router.delete('/:id', auth_1.authenticateToken, testimonioController_1.eliminarMiTestimonio);
router.get('/admin/todos', auth_1.authenticateToken, auth_1.requireAdmin, testimonioController_1.adminListarTestimonios);
router.patch('/admin/:id/aprobar', auth_1.authenticateToken, auth_1.requireAdmin, testimonioController_1.adminAprobarTestimonio);
router.patch('/admin/:id/rechazar', auth_1.authenticateToken, auth_1.requireAdmin, testimonioController_1.adminRechazarTestimonio);
router.patch('/admin/:id/destacar', auth_1.authenticateToken, auth_1.requireAdmin, testimonioController_1.adminDestacarTestimonio);
router.delete('/admin/:id', auth_1.authenticateToken, auth_1.requireAdmin, testimonioController_1.adminEliminarTestimonio);
exports.default = router;
//# sourceMappingURL=testimonioRoutes.js.map