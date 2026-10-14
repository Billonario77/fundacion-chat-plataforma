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
    // 1. Marcar vencidas y enviar email de vencimiento
    const vencidas = await suscripcionService.marcarVencidas();
    if (vencidas.length > 0) {
      console.log(`✅ [suscripcionWorker] ${vencidas.length} suscripción(es) marcada(s) como vencida(s).`);

      for (const sub of vencidas) {
        try {
          if (sub.email_vencimiento_enviado) continue;

          const user = await suscripcionService.obtenerUsuarioDeSuscripcion(sub.usuario_id);
          if (!user?.email) continue;

          const { enviarVencimientoSuscripcion } = await import('../services/emailService');
          await enviarVencimientoSuscripcion({
            email: user.email,
            nombre: user.nombre || 'Usuario',
            plan: sub.plan,
          });
          await suscripcionService.marcarEmailVencimientoEnviado(sub.id);
          console.log(`📧 Email de vencimiento enviado a: ${user.email}`);
        } catch (err) {
          console.error('⚠️ Error al enviar email de vencimiento:', err);
        }
      }
    } else {
      console.log('ℹ️ [suscripcionWorker] Sin suscripciones vencidas.');
    }

    // 2. Enviar recordatorios 3 días antes del vencimiento
    const proximas = await suscripcionService.obtenerProximasAVencer(3);
    if (proximas.length > 0) {
      console.log(`⏳ [suscripcionWorker] ${proximas.length} suscripción(es) próxima(s) a vencer.`);

      for (const sub of proximas) {
        try {
          const user = await suscripcionService.obtenerUsuarioDeSuscripcion(sub.usuario_id);
          if (!user?.email) continue;

          const sesionesRestantes = sub.sesiones_incluidas - sub.sesiones_usadas;
          const diasRestantes = Math.max(
            0,
            Math.ceil((new Date(sub.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
          const fechaFinFormateada = new Date(sub.fecha_fin).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Bogota',
          });

          const { enviarRecordatorioVencimientoSuscripcion } = await import('../services/emailService');
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
        } catch (err) {
          console.error('⚠️ Error al enviar recordatorio de vencimiento:', err);
        }
      }
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