"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerProgresoMeta = exports.obtenerDonacionPorReferencia = exports.obtenerEstadisticasDonaciones = exports.obtenerDonaciones = exports.webhookWompi = exports.generarFirmaDonacion = void 0;
const pg_1 = require("pg");
const wompiService_1 = require("../services/wompiService");
const emailService_1 = require("../services/emailService");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    max: 20
});
const wompiService = new wompiService_1.WompiService();
const generarFirmaDonacion = async (req, res) => {
    try {
        const { monto, nombreDonante, emailDonante, esAnonima, mensaje } = req.body;
        if (!monto || monto <= 0) {
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        }
        if (monto < 5000) {
            return res.status(400).json({ error: 'El monto mínimo de donación es $5.000 COP' });
        }
        const referencia = wompiService.generarReferencia();
        const montoEnCentavos = Math.round(monto * 100);
        const firmaIntegridad = wompiService.generarFirmaIntegridad(referencia, montoEnCentavos, 'COP');
        const result = await pool.query(`INSERT INTO donaciones (
        usuario_id, nombre_donante, email_donante, monto, moneda,
        estado, referencia_wompi, mensaje, es_anonima
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`, [
            null,
            nombreDonante || null,
            emailDonante || null,
            monto,
            'COP',
            'pendiente',
            referencia,
            mensaje || null,
            esAnonima || false
        ]);
        const donacion = result.rows[0];
        res.json({
            success: true,
            data: {
                referencia,
                montoEnCentavos,
                firmaIntegridad,
                publicKey: wompiService.getPublicKey(),
                moneda: 'COP',
                donacionId: donacion.id
            }
        });
    }
    catch (error) {
        console.error('Error al generar firma de donación:', error);
        res.status(500).json({ error: error.message || 'Error al generar firma' });
    }
};
exports.generarFirmaDonacion = generarFirmaDonacion;
const webhookWompi = async (req, res) => {
    try {
        const { event, data, signature, timestamp } = req.body;
        console.log('📩 Webhook Wompi recibido:', event);
        console.log('📩 Timestamp:', timestamp);
        const esValido = wompiService.verificarWebhook(req.body, signature);
        if (!esValido) {
            console.error('❌ Firma de webhook inválida');
            return res.status(200).json({ received: true, verified: false });
        }
        console.log('✅ Firma de webhook válida');
        if (event === 'transaction.updated') {
            const transaccion = data.transaction;
            const referencia = transaccion.reference;
            const estadoWompi = transaccion.status;
            console.log(`📌 Transacción ${referencia} - Estado: ${estadoWompi}`);
            let estadoInterno = 'pendiente';
            if (estadoWompi === 'APPROVED')
                estadoInterno = 'completada';
            else if (estadoWompi === 'DECLINED')
                estadoInterno = 'fallida';
            else if (estadoWompi === 'VOIDED')
                estadoInterno = 'cancelada';
            else if (estadoWompi === 'ERROR')
                estadoInterno = 'error';
            const donacionResult = await pool.query(`SELECT id FROM donaciones WHERE referencia_wompi = $1`, [referencia]);
            if (donacionResult.rows.length > 0) {
                const estadoDonacion = estadoInterno === 'completada' ? 'completada' : estadoInterno;
                const donacionData = await pool.query(`SELECT id, nombre_donante, email_donante, monto, mensaje, es_anonima, estado
           FROM donaciones WHERE referencia_wompi = $1`, [referencia]);
                await pool.query(`UPDATE donaciones 
           SET estado = $1, 
               metodo_pago = $2,
               updated_at = NOW()
           WHERE referencia_wompi = $3`, [estadoDonacion, transaccion.payment_method_type || null, referencia]);
                console.log(`✅ Donación actualizada: ${referencia} → ${estadoDonacion}`);
                if (estadoDonacion === 'completada') {
                    const donacion = donacionData.rows[0];
                    if (donacion && donacion.email_donante && !donacion.es_anonima) {
                        try {
                            await (0, emailService_1.enviarAgradecimientoDonacion)({
                                email: donacion.email_donante,
                                nombre: donacion.nombre_donante || 'Amig@',
                                monto: parseFloat(donacion.monto),
                                mensaje: donacion.mensaje || undefined
                            });
                            console.log(`📧 Email de agradecimiento enviado a: ${donacion.email_donante}`);
                        }
                        catch (emailError) {
                            console.error('⚠️ Error al enviar email de donación:', emailError);
                        }
                    }
                }
            }
            else {
                const cobroResult = await pool.query(`SELECT id, turno_id FROM cobros WHERE referencia_wompi = $1`, [referencia]);
                if (cobroResult.rows.length > 0) {
                    const cobro = cobroResult.rows[0];
                    const estadoCobro = estadoInterno === 'completada' ? 'pagado' : estadoInterno;
                    const datosEmailQuery = await pool.query(`SELECT 
              t.fecha_programada,
              u.nombre as usuario_nombre,
              u.email as usuario_email,
              g.nombre as guia_nombre,
              c.total
             FROM cobros c
             INNER JOIN usuarios u ON u.id = c.usuario_id
             INNER JOIN usuarios g ON g.id = c.guia_id
             INNER JOIN turnos t ON t.id = c.turno_id
             WHERE c.id = $1`, [cobro.id]);
                    const fechaPago = estadoCobro === 'pagado' ? new Date() : null;
                    await pool.query(`UPDATE cobros 
             SET estado = $1,
                 metodo_pago = $2,
                 pagado_at = COALESCE($3, pagado_at),
                 updated_at = NOW()
             WHERE id = $4`, [estadoCobro, transaccion.payment_method_type || null, fechaPago, cobro.id]);
                    console.log(`✅ Cobro actualizado: ${referencia} → ${estadoCobro}`);
                    if (estadoCobro === 'pagado') {
                        await pool.query(`UPDATE turnos SET estado = 'pendiente' WHERE id = $1`, [cobro.turno_id]);
                        console.log(`✅ Turno ${cobro.turno_id} actualizado a "pendiente" (listo para que el guía acepte)`);
                        const datosEmail = datosEmailQuery.rows[0];
                        if (datosEmail && datosEmail.usuario_email) {
                            try {
                                const fechaFormateada = new Date(datosEmail.fecha_programada).toLocaleString('es-CO', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'America/Bogota'
                                });
                                await (0, emailService_1.enviarConfirmacionPago)({
                                    email: datosEmail.usuario_email,
                                    nombre: datosEmail.usuario_nombre || 'Usuario',
                                    fechaSesion: fechaFormateada,
                                    guiaNombre: datosEmail.guia_nombre || 'tu guía',
                                    monto: parseFloat(datosEmail.total),
                                    metodoPago: transaccion.payment_method_type || 'Tarjeta'
                                });
                                console.log(`📧 Email de confirmación enviado a: ${datosEmail.usuario_email}`);
                            }
                            catch (emailError) {
                                console.error('⚠️ Error al enviar email de confirmación:', emailError);
                            }
                        }
                    }
                }
                else {
                    console.warn(`⚠️ No se encontró donación ni cobro con referencia: ${referencia}`);
                }
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Error en webhook Wompi:', error);
        res.status(200).json({ received: true, error: error.message });
    }
};
exports.webhookWompi = webhookWompi;
const obtenerDonaciones = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver donaciones' });
        }
        const { estado, fecha_desde, fecha_hasta } = req.query;
        let query = `SELECT * FROM donaciones WHERE 1=1`;
        const params = [];
        let paramIndex = 1;
        if (estado) {
            query += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        if (fecha_desde) {
            query += ` AND created_at >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }
        if (fecha_hasta) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }
        query += ` ORDER BY created_at DESC LIMIT 500`;
        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error al obtener donaciones:', error);
        res.status(500).json({ error: error.message || 'Error al obtener donaciones' });
    }
};
exports.obtenerDonaciones = obtenerDonaciones;
const obtenerEstadisticasDonaciones = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver estadísticas' });
        }
        const query = `
      SELECT 
        COUNT(*) as total_donaciones,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END), 0) as completadas,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END), 0) as pendientes,
        COALESCE(SUM(CASE WHEN estado = 'fallida' THEN 1 ELSE 0 END), 0) as fallidas,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) as total_recaudado,
        COALESCE(AVG(CASE WHEN estado = 'completada' THEN monto ELSE NULL END), 0) as promedio_donacion
      FROM donaciones
    `;
        const result = await pool.query(query);
        const porMesQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as cantidad,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) as total
      FROM donaciones
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `;
        const porMesResult = await pool.query(porMesQuery);
        res.json({
            success: true,
            data: {
                ...result.rows[0],
                por_mes: porMesResult.rows
            }
        });
    }
    catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
    }
};
exports.obtenerEstadisticasDonaciones = obtenerEstadisticasDonaciones;
const obtenerDonacionPorReferencia = async (req, res) => {
    try {
        const { referencia } = req.params;
        const result = await pool.query(`SELECT id, referencia_wompi, nombre_donante, email_donante, monto, moneda, 
              estado, metodo_pago, mensaje, es_anonima, created_at 
       FROM donaciones 
       WHERE referencia_wompi = $1`, [referencia]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error al obtener donación:', error);
        res.status(500).json({ error: error.message || 'Error al obtener donación' });
    }
};
exports.obtenerDonacionPorReferencia = obtenerDonacionPorReferencia;
const obtenerProgresoMeta = async (req, res) => {
    try {
        const metaQuery = await pool.query(`SELECT valor FROM configuracion WHERE clave = 'meta_mensual_donaciones'`);
        const meta = parseFloat(metaQuery.rows[0]?.valor || '5000000');
        const totalQuery = await pool.query(`SELECT COALESCE(SUM(monto), 0) as total
       FROM donaciones
       WHERE estado = 'completada'
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)`);
        const totalRecaudado = parseFloat(totalQuery.rows[0].total);
        const porcentaje = meta > 0 ? Math.min(100, Math.round((totalRecaudado / meta) * 100)) : 0;
        const countQuery = await pool.query(`SELECT COUNT(*) as total
       FROM donaciones
       WHERE estado = 'completada'
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)`);
        const totalDonaciones = parseInt(countQuery.rows[0].total);
        const mesActual = new Date().toLocaleString('es-CO', { month: 'long' });
        const mesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
        res.json({
            success: true,
            data: {
                meta,
                totalRecaudado,
                porcentaje,
                totalDonaciones,
                mesActual: mesCapitalizado,
                falta: Math.max(0, meta - totalRecaudado)
            }
        });
    }
    catch (error) {
        console.error('Error al obtener progreso de meta:', error);
        res.status(500).json({ error: error.message || 'Error al obtener progreso' });
    }
};
exports.obtenerProgresoMeta = obtenerProgresoMeta;
//# sourceMappingURL=donacionesController.js.map