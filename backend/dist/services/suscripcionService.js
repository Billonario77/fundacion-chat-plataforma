"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuscripcionService = void 0;
const emailService_1 = require("./emailService");
class SuscripcionService {
    constructor(pool) {
        this.pool = pool;
    }
    async obtenerPlanActivo(usuarioId) {
        const query = `
      SELECT *
      FROM suscripciones
      WHERE usuario_id = $1
        AND estado = 'activa'
        AND estado_pago = 'pagado'
        AND fecha_fin > NOW()
      ORDER BY fecha_fin DESC
      LIMIT 1
    `;
        const result = await this.pool.query(query, [usuarioId]);
        return result.rows[0] || null;
    }
    async tieneSuscripcionActiva(usuarioId) {
        const sub = await this.obtenerPlanActivo(usuarioId);
        return sub !== null;
    }
    async obtenerPlanes() {
        const query = `
      SELECT clave, valor
      FROM configuracion
      WHERE clave IN (
        'plan_bienestar_sesiones', 'plan_bienestar_precio',
        'plan_refugio_sesiones',   'plan_refugio_precio',
        'plan_santuario_sesiones', 'plan_santuario_precio'
      )
    `;
        const result = await this.pool.query(query);
        const mapa = {};
        for (const row of result.rows)
            mapa[row.clave] = row.valor;
        return {
            bienestar: {
                sesiones: parseInt(mapa['plan_bienestar_sesiones'] || '4'),
                precio: parseFloat(mapa['plan_bienestar_precio'] || '300000'),
            },
            refugio: {
                sesiones: parseInt(mapa['plan_refugio_sesiones'] || '9'),
                precio: parseFloat(mapa['plan_refugio_precio'] || '600000'),
            },
            santuario: {
                sesiones: parseInt(mapa['plan_santuario_sesiones'] || '20'),
                precio: parseFloat(mapa['plan_santuario_precio'] || '1000000'),
            },
        };
    }
    async crearPendiente(usuarioId, plan, montoMultasPendientes = 0) {
        const planes = await this.obtenerPlanes();
        const config = planes[plan];
        if (!config)
            throw new Error(`Plan inválido: ${plan}`);
        const precioTotal = config.precio + montoMultasPendientes;
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const referencia = `SUS-${plan.toUpperCase()}-${timestamp}-${random}`;
        const query = `
      INSERT INTO suscripciones (
        usuario_id, plan, sesiones_incluidas, sesiones_usadas,
        precio_pagado, fecha_inicio, fecha_fin,
        estado, estado_pago, referencia_wompi
      )
      VALUES ($1, $2, $3, 0, $4, NOW(), NOW() + INTERVAL '30 days',
              'activa', 'pendiente', $5)
      RETURNING *
    `;
        const result = await this.pool.query(query, [
            usuarioId,
            plan,
            config.sesiones,
            precioTotal,
            referencia,
        ]);
        return result.rows[0];
    }
    async obtenerPorReferencia(referencia) {
        const result = await this.pool.query(`SELECT * FROM suscripciones WHERE referencia_wompi = $1 LIMIT 1`, [referencia]);
        return result.rows[0] || null;
    }
    async obtenerHistorial(usuarioId) {
        const result = await this.pool.query(`SELECT * FROM suscripciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC`, [usuarioId]);
        return result.rows;
    }
    async obtenerMultasPendientesMonto(usuarioId) {
        const result = await this.pool.query(`SELECT COALESCE(SUM(total), 0) AS total
       FROM cobros
       WHERE usuario_id = $1
         AND tipo = 'multa'
         AND estado = 'pendiente'`, [usuarioId]);
        return parseFloat(result.rows[0]?.total || '0');
    }
    async confirmarPago(referencia) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const subQuery = await client.query(`SELECT * FROM suscripciones WHERE referencia_wompi = $1 FOR UPDATE`, [referencia]);
            const sub = subQuery.rows[0];
            if (!sub) {
                throw new Error(`Suscripción con referencia ${referencia} no encontrada`);
            }
            if (sub.estado_pago === 'pagado') {
                await client.query('COMMIT');
                return sub;
            }
            const updateQuery = `
        UPDATE suscripciones
        SET estado_pago = 'pagado',
            pagado_at = NOW(),
            fecha_inicio = NOW(),
            fecha_fin = NOW() + INTERVAL '30 days',
            sesiones_usadas = 0,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
            const updateResult = await client.query(updateQuery, [sub.id]);
            const subActualizada = updateResult.rows[0];
            await client.query(`UPDATE cobros
         SET estado = 'pagado',
             pagado_at = NOW(),
             metodo_pago = 'wompi_suscripcion',
             updated_at = NOW()
         WHERE usuario_id = $1
           AND tipo = 'multa'
           AND estado = 'pendiente'`, [sub.usuario_id]);
            await client.query('COMMIT');
            try {
                const userQuery = await this.pool.query(`SELECT email, nombre FROM usuarios WHERE id = $1`, [subActualizada.usuario_id]);
                const user = userQuery.rows[0];
                if (user?.email) {
                    const fechaFinFormateada = new Date(subActualizada.fecha_fin).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'America/Bogota',
                    });
                    await (0, emailService_1.enviarBienvenidaSuscripcion)({
                        email: user.email,
                        nombre: user.nombre || 'Usuario',
                        plan: subActualizada.plan,
                        sesionesIncluidas: subActualizada.sesiones_incluidas,
                        precioPagado: parseFloat(String(subActualizada.precio_pagado)),
                        fechaFin: fechaFinFormateada,
                    });
                    console.log(`📧 Email de bienvenida enviado a: ${user.email}`);
                }
            }
            catch (emailError) {
                console.error('⚠️ Error al enviar email de bienvenida:', emailError);
            }
            return subActualizada;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async consumirSesion(usuarioId) {
        const sub = await this.obtenerPlanActivo(usuarioId);
        if (!sub) {
            return { ok: false, sesionesRestantes: 0 };
        }
        if (sub.sesiones_usadas >= sub.sesiones_incluidas) {
            return { ok: false, sesionesRestantes: 0 };
        }
        const updateResult = await this.pool.query(`UPDATE suscripciones
       SET sesiones_usadas = sesiones_usadas + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING sesiones_incluidas, sesiones_usadas`, [sub.id]);
        const row = updateResult.rows[0];
        const restantes = row.sesiones_incluidas - row.sesiones_usadas;
        return { ok: true, sesionesRestantes: restantes };
    }
    async marcarVencidas() {
        const result = await this.pool.query(`UPDATE suscripciones
       SET estado = 'vencida',
           updated_at = NOW()
       WHERE estado = 'activa'
         AND estado_pago = 'pagado'
         AND fecha_fin <= NOW()
       RETURNING *`);
        return result.rows;
    }
    async obtenerProximasAVencer(dias = 3) {
        const result = await this.pool.query(`SELECT * FROM suscripciones
       WHERE estado = 'activa'
         AND estado_pago = 'pagado'
         AND fecha_fin > NOW()
         AND fecha_fin <= NOW() + ($1 || ' days')::interval
         AND recordatorio_vencimiento_enviado = false
       ORDER BY fecha_fin ASC`, [dias]);
        return result.rows;
    }
    async marcarRecordatorioEnviado(id) {
        await this.pool.query(`UPDATE suscripciones
       SET recordatorio_vencimiento_enviado = true, updated_at = NOW()
       WHERE id = $1`, [id]);
    }
    async marcarEmailVencimientoEnviado(id) {
        await this.pool.query(`UPDATE suscripciones
       SET email_vencimiento_enviado = true, updated_at = NOW()
       WHERE id = $1`, [id]);
    }
    async obtenerUsuarioDeSuscripcion(usuarioId) {
        const result = await this.pool.query(`SELECT email, nombre FROM usuarios WHERE id = $1`, [usuarioId]);
        return result.rows[0] || null;
    }
}
exports.SuscripcionService = SuscripcionService;
//# sourceMappingURL=suscripcionService.js.map