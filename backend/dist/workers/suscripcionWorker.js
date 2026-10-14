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
        if (vencidas.length > 0) {
            console.log(`✅ [suscripcionWorker] ${vencidas.length} suscripción(es) marcada(s) como vencida(s).`);
            for (const sub of vencidas) {
                try {
                    if (sub.email_vencimiento_enviado)
                        continue;
                    const user = await suscripcionService.obtenerUsuarioDeSuscripcion(sub.usuario_id);
                    if (!user?.email)
                        continue;
                    const { enviarVencimientoSuscripcion } = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
                    await enviarVencimientoSuscripcion({
                        email: user.email,
                        nombre: user.nombre || 'Usuario',
                        plan: sub.plan,
                    });
                    await suscripcionService.marcarEmailVencimientoEnviado(sub.id);
                    console.log(`📧 Email de vencimiento enviado a: ${user.email}`);
                }
                catch (err) {
                    console.error('⚠️ Error al enviar email de vencimiento:', err);
                }
            }
        }
        else {
            console.log('ℹ️ [suscripcionWorker] Sin suscripciones vencidas.');
        }
        const proximas = await suscripcionService.obtenerProximasAVencer(3);
        if (proximas.length > 0) {
            console.log(`⏳ [suscripcionWorker] ${proximas.length} suscripción(es) próxima(s) a vencer.`);
            for (const sub of proximas) {
                try {
                    const user = await suscripcionService.obtenerUsuarioDeSuscripcion(sub.usuario_id);
                    if (!user?.email)
                        continue;
                    const sesionesRestantes = sub.sesiones_incluidas - sub.sesiones_usadas;
                    const diasRestantes = Math.max(0, Math.ceil((new Date(sub.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                    const fechaFinFormateada = new Date(sub.fecha_fin).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'America/Bogota',
                    });
                    const { enviarRecordatorioVencimientoSuscripcion } = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
                    await enviarRecordatorioVencimientoSuscripcion({
                        email: user.email,
                        nombre: user.nombre || 'Usuario',
                        plan: sub.plan,
                        sesionesRestantes,
                        fechaFin: fechaFinFormateada,
                        diasRestantes,
                    });
                    await suscripcionService.marcarRecordatorioEnviado(sub.id);
                    console.log(`📧 Recordatorio de vencimiento enviado a: ${user.email}`);
                }
                catch (err) {
                    console.error('⚠️ Error al enviar recordatorio de vencimiento:', err);
                }
            }
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