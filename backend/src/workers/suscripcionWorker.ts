// backend/src/workers/suscripcionWorker.ts

import { Pool } from 'pg';
import { SuscripcionService } from '../services/suscripcionService';

// ============================================
// CONFIGURACIÓN
// ============================================
const INTERVALO_MINUTOS = 30;
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 5,
});

const suscripcionService = new SuscripcionService(pool);

// ============================================
// EJECUCIÓN
// ============================================
async function ejecutarRevision() {
  try {
    const vencidas = await suscripcionService.marcarVencidas();
    if (vencidas > 0) {
      console.log(`✅ [suscripcionWorker] ${vencidas} suscripción(es) marcada(s) como vencida(s).`);
    } else {
      console.log('ℹ️ [suscripcionWorker] Sin suscripciones por vencer.');
    }
  } catch (error) {
    console.error('❌ [suscripcionWorker] Error inesperado:', error);
  }
}

// ============================================
// ARRANQUE
// ============================================
console.log(`🚀 [suscripcionWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);

// Primera ejecución a los 45 segundos (para no bloquear el arranque)
setTimeout(() => {
  console.log('⏱️ [suscripcionWorker] Primera revisión...');
  ejecutarRevision();
}, 45 * 1000);

// Ejecuciones periódicas
setInterval(ejecutarRevision, INTERVALO_MS);

export {};