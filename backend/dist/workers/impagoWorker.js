"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const impagoService_1 = require("../services/impagoService");
const INTERVALO_MINUTOS = 15;
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;
async function ejecutarRevision() {
    try {
        await impagoService_1.ImpagoService.procesarTurnosImpagos();
    }
    catch (error) {
        console.error('❌ [impagoWorker] Error inesperado:', error);
    }
}
console.log(`🚀 [impagoWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);
setTimeout(() => {
    console.log('⏱️ [impagoWorker] Primera revisión...');
    ejecutarRevision();
}, 30 * 1000);
setInterval(ejecutarRevision, INTERVALO_MS);
//# sourceMappingURL=impagoWorker.js.map