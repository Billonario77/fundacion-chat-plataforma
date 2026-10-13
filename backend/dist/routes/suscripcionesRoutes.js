"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const suscripcionesController_1 = require("../controllers/suscripcionesController");
const router = (0, express_1.Router)();
router.get('/planes', auth_1.authenticateToken, suscripcionesController_1.listarPlanes);
router.post('/iniciar-pago', auth_1.authenticateToken, suscripcionesController_1.iniciarPago);
router.get('/mi-plan', auth_1.authenticateToken, suscripcionesController_1.miPlan);
router.get('/historial', auth_1.authenticateToken, suscripcionesController_1.historial);
exports.default = router;
//# sourceMappingURL=suscripcionesRoutes.js.map