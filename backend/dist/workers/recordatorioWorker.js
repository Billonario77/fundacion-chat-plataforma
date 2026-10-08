"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recordatorioService_1 = require("../services/recordatorioService");
const INTERVALO_MINUTOS = 15;
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;
async function ejecutarRevision() {
    try {
        await recordatorioService_1.RecordatorioService.procesarRecordatorios();
    }
    catch (error) {
        console.error('❌ [recordatorioWorker] Error inesperado:', error);
    }
}
console.log(`🚀 [recordatorioWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);
setTimeout(() => {
    console.log('⏱️ [recordatorioWorker] Primera revisión...');
    ejecutarRevision();
}, 45 * 1000);
setInterval(ejecutarRevision, INTERVALO_MS);
//# sourceMappingURL=recordatorioWorker.js.map