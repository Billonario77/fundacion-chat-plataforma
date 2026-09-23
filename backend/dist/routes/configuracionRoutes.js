"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const configuracionController_1 = require("../controllers/configuracionController");
const router = (0, express_1.Router)();
router.get('/', configuracionController_1.obtenerConfiguracion);
router.get('/:clave', configuracionController_1.obtenerConfiguracionPorClave);
router.put('/', auth_1.authenticateToken, configuracionController_1.actualizarConfiguracion);
exports.default = router;
//# sourceMappingURL=configuracionRoutes.js.map