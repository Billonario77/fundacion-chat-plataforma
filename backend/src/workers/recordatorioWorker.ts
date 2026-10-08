// backend/src/workers/recordatorioWorker.ts

import { RecordatorioService } from '../services/recordatorioService';

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
    await RecordatorioService.procesarRecordatorios();
  } catch (error) {
    console.error('❌ [recordatorioWorker] Error inesperado:', error);
  }
}

// ============================================
// ARRANQUE
// ============================================
console.log(`🚀 [recordatorioWorker] Iniciado. Revisión cada ${INTERVALO_MINUTOS} minutos.`);

// Primera ejecución a los 45 segundos (después del impagoWorker)
setTimeout(() => {
  console.log('⏱️ [recordatorioWorker] Primera revisión...');
  ejecutarRevision();
}, 45 * 1000);

// Ejecuciones periódicas
setInterval(ejecutarRevision, INTERVALO_MS);

export {};