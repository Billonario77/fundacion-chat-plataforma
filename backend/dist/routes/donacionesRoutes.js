"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const isAdmin_1 = require("../middleware/isAdmin");
const donacionesController_1 = require("../controllers/donacionesController");
const router = (0, express_1.Router)();
router.post('/generar-firma', donacionesController_1.generarFirmaDonacion);
router.post('/webhook', donacionesController_1.webhookWompi);
router.get('/progreso-meta', donacionesController_1.obtenerProgresoMeta);
router.get('/:referencia', donacionesController_1.obtenerDonacionPorReferencia);
router.get('/', auth_1.authenticateToken, isAdmin_1.isAdmin, donacionesController_1.obtenerDonaciones);
router.get('/admin/estadisticas', auth_1.authenticateToken, isAdmin_1.isAdmin, donacionesController_1.obtenerEstadisticasDonaciones);
exports.default = router;
//# sourceMappingURL=donacionesRoutes.js.map