"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const turnosController = __importStar(require("../controllers/turnosController"));
const router = (0, express_1.Router)();
router.post('/solicitar', auth_1.authenticateToken, turnosController.solicitarApoyo);
router.get('/mis-turnos', auth_1.authenticateToken, auth_1.requireGuia, turnosController.misTurnos);
router.get('/mis-solicitudes', auth_1.authenticateToken, turnosController.misSolicitudes);
router.get('/historial', auth_1.authenticateToken, turnosController.getHistorialTurnos);
router.get('/:turnoId', auth_1.authenticateToken, turnosController.obtenerTurnoPorId);
router.patch('/:turnoId/estado', auth_1.authenticateToken, turnosController.actualizarEstadoTurno);
router.post('/:turnoId/cancelar', auth_1.authenticateToken, turnosController.cancelarTurno);
router.post('/:turnoId/reprogramar', auth_1.authenticateToken, turnosController.reprogramarTurno);
router.get('/mis-reprogramaciones', auth_1.authenticateToken, turnosController.getMisReprogramaciones);
router.post('/cancelaciones/marcar-vistas', auth_1.authenticateToken, turnosController.marcarCancelacionesComoVistas);
router.get('/cancelaciones/no-vistas/count', auth_1.authenticateToken, turnosController.contarCancelacionesNoVistas);
router.get('/mi-guia', auth_1.authenticateToken, turnosController.getMiGuiaActual);
router.get('/mi-perfil', auth_1.authenticateToken, turnosController.getMiPerfil);
router.put('/mi-foto', auth_1.authenticateToken, turnosController.actualizarFotoPerfil);
router.post('/completar-datos', auth_1.authenticateToken, turnosController.completarMisDatos);
exports.default = router;
//# sourceMappingURL=turnosRoutes.js.map