"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const suscripcionService_1 = require("../services/suscripcionService");
const INTERVALO_MINUTOS = 30;
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    max: 5,
});
const suscripcionService = new suscripcionService_1.SuscripcionService(pool);
async function ejecutarRevision() {
    try {
        const vencidas = await suscripcionService.marcarVencidas();
        if (vencidas > 0) {
            console.log(`✅ [suscripcionWorker] ${vencidas} suscripción(es) marcada(s) como vencida(s).`);
        }
        else {
            console.log('ℹ️ [suscripcionWorker] Sin suscripciones por vencer.');
        }
    }
    catch (error) {
        console.error('❌ [suscripcionWorker] Error inesperado:', error);
    }
}
console.log(`🚀 [suscripcionWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);
setTimeout(() => {
    console.log('⏱️ [suscripcionWorker] Primera revisión...');
    ejecutarRevision();
}, 45 * 1000);
setInterval(ejecutarRevision, INTERVALO_MS);
//# sourceMappingURL=suscripcionWorker.js.map