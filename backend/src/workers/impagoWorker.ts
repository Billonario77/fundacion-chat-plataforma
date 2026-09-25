// backend/src/workers/impagoWorker.ts

import { ImpagoService } from '../services/impagoService';

// ============================================
// CONFIGURACIÓN
// ============================================
const INTERVALO_MINUTOS = 15;
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;

// ============================================
// EJECUCIÓN
// ============================================
async function ejecutarRevision() {
  try {
    await ImpagoService.procesarTurnosImpagos();
  } catch (error) {
    console.error('❌ [impagoWorker] Error inesperado:', error);
  }
}

// ============================================
// ARRANQUE
// ============================================
console.log(`🚀 [impagoWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);

// Primera ejecución a los 30 segundos (para no bloquear el arranque)
setTimeout(() => {
  console.log('⏱️ [impagoWorker] Primera revisión...');
  ejecutarRevision();
}, 30 * 1000);

// Ejecuciones periódicas
setInterval(ejecutarRevision, INTERVALO_MS);

export {};