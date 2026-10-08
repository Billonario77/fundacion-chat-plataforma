"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordatorioService = void 0;
const connection_1 = require("../database/connection");
const emailService_1 = require("./emailService");
class RecordatorioService {
    static async procesarRecordatorios() {
        const inicio = new Date();
        console.log(`\n🔔 [RecordatorioService] Iniciando revisión - ${inicio.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        let enviados24h = 0;
        let enviados2h = 0;
        let errores = 0;
        try {
            const query24h = `
        SELECT 
          t.id,
          t.usuario_id,
          t.guia_id,
          t.fecha_programada,
          t.estado,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email,
          g.nombre AS guia_nombre
        FROM turnos t
        JOIN usuarios u ON u.id = t.usuario_id
        LEFT JOIN usuarios g ON g.id = t.guia_id
        WHERE t.recordatorio_24h_enviado = false
          AND t.estado IN ('pendiente', 'pendiente_pago', 'aceptado')
          AND t.fecha_programada > NOW() + INTERVAL '23 hours'
          AND t.fecha_programada <= NOW() + INTERVAL '25 hours'
      `;
            const result24h = await connection_1.pool.query(query24h);
            console.log(`📋 Turnos para recordatorio 24h: ${result24h.rows.length}`);
            for (const turno of result24h.rows) {
                try {
                    if (!turno.usuario_email) {
                        console.warn(`⚠️ Turno ${turno.id} sin email de usuario, saltando`);
                        continue;
                    }
                    const fechaFormateada = new Date(turno.fecha_programada).toLocaleString('es-CO', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Bogota'
                    });
                    await (0, emailService_1.enviarRecordatorio24h)({
                        email: turno.usuario_email,
                        nombre: turno.usuario_nombre || 'Usuario',
                        fechaSesion: fechaFormateada,
                        guiaNombre: turno.guia_nombre || 'tu guía',
                        requierePago: turno.estado === 'pendiente_pago'
                    });
                    await connection_1.pool.query(`UPDATE turnos SET recordatorio_24h_enviado = true WHERE id = $1`, [turno.id]);
                    enviados24h++;
                    console.log(`✅ Recordatorio 24h enviado: turno ${turno.id} → ${turno.usuario_email}`);
                }
                catch (err) {
                    errores++;
                    console.error(`❌ Error enviando recordatorio 24h para turno ${turno.id}:`, err);
                }
            }
            const query2h = `
        SELECT 
          t.id,
          t.usuario_id,
          t.guia_id,
          t.fecha_programada,
          t.estado,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email,
          g.nombre AS guia_nombre
        FROM turnos t
        JOIN usuarios u ON u.id = t.usuario_id
        LEFT JOIN usuarios g ON g.id = t.guia_id
        WHERE t.recordatorio_1h_enviado = false
          AND t.estado IN ('pendiente', 'pendiente_pago', 'aceptado')
          AND t.fecha_programada > NOW() + INTERVAL '105 minutes'
          AND t.fecha_programada <= NOW() + INTERVAL '135 minutes'
      `;
            const result2h = await connection_1.pool.query(query2h);
            console.log(`📋 Turnos para recordatorio 2h: ${result2h.rows.length}`);
            for (const turno of result2h.rows) {
                try {
                    if (!turno.usuario_email) {
                        console.warn(`⚠️ Turno ${turno.id} sin email de usuario, saltando`);
                        continue;
                    }
                    const fechaFormateada = new Date(turno.fecha_programada).toLocaleString('es-CO', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Bogota'
                    });
                    await (0, emailService_1.enviarRecordatorio2h)({
                        email: turno.usuario_email,
                        nombre: turno.usuario_nombre || 'Usuario',
                        fechaSesion: fechaFormateada,
                        guiaNombre: turno.guia_nombre || 'tu guía',
                        requierePago: turno.estado === 'pendiente_pago'
                    });
                    await connection_1.pool.query(`UPDATE turnos SET recordatorio_1h_enviado = true WHERE id = $1`, [turno.id]);
                    enviados2h++;
                    console.log(`✅ Recordatorio 2h enviado: turno ${turno.id} → ${turno.usuario_email}`);
                }
                catch (err) {
                    errores++;
                    console.error(`❌ Error enviando recordatorio 2h para turno ${turno.id}:`, err);
                }
            }
            console.log(`✅ [RecordatorioService] Completado - 24h: ${enviados24h}, 2h: ${enviados2h}, errores: ${errores}\n`);
            return { enviados24h, enviados2h, errores };
        }
        catch (error) {
            console.error('❌ [RecordatorioService] Error general:', error);
            return { enviados24h, enviados2h, errores: errores + 1 };
        }
    }
}
exports.RecordatorioService = RecordatorioService;
//# sourceMappingURL=recordatorioService.js.map