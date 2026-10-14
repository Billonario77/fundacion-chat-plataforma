"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricasSuscripcionesAdmin = exports.listarSuscripcionesAdmin = exports.confirmarSuscripcionManual = exports.historial = exports.miPlan = exports.iniciarPago = exports.listarPlanes = void 0;
const connection_1 = require("../database/connection");
const suscripcionService_1 = require("../services/suscripcionService");
const wompiService_1 = require("../services/wompiService");
const suscripcionService = new suscripcionService_1.SuscripcionService(connection_1.pool);
const wompiService = new wompiService_1.WompiService();
const PLANES_VALIDOS = ['bienestar', 'refugio', 'santuario'];
const listarPlanes = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const planes = await suscripcionService.obtenerPlanes();
        const multasPendientes = await suscripcionService.obtenerMultasPendientesMonto(req.user.id);
        res.json({
            success: true,
            data: {
                planes: [
                    { id: 'bienestar', nombre: 'Bienestar', ...planes.bienestar },
                    { id: 'refugio', nombre: 'Refugio', ...planes.refugio },
                    { id: 'santuario', nombre: 'Santuario', ...planes.santuario },
                ],
                multasPendientes,
            },
        });
    }
    catch (error) {
        console.error('Error al listar planes:', error);
        res.status(500).json({ error: error.message || 'Error al listar planes' });
    }
};
exports.listarPlanes = listarPlanes;
const iniciarPago = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const { plan } = req.body;
        if (!plan || !PLANES_VALIDOS.includes(plan)) {
            return res.status(400).json({
                error: 'Plan inválido. Debe ser: bienestar, refugio o santuario',
            });
        }
        const pendiente = await connection_1.pool.query(`SELECT id FROM suscripciones
       WHERE usuario_id = $1
         AND estado_pago = 'pendiente'
         AND created_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`, [usuarioId]);
        if (pendiente.rows.length > 0) {
            return res.status(409).json({
                error: 'Ya tienes un pago de suscripción pendiente. Completa o espera 1 hora antes de iniciar otro.',
            });
        }
        const multasPendientes = await suscripcionService.obtenerMultasPendientesMonto(usuarioId);
        const suscripcion = await suscripcionService.crearPendiente(usuarioId, plan, multasPendientes);
        const montoEnCentavos = Math.round(parseFloat(String(suscripcion.precio_pagado)) * 100);
        const firmaIntegridad = wompiService.generarFirmaIntegridad(suscripcion.referencia_wompi, montoEnCentavos, 'COP');
        res.json({
            success: true,
            data: {
                suscripcionId: suscripcion.id,
                plan: suscripcion.plan,
                sesionesIncluidas: suscripcion.sesiones_incluidas,
                precioPlan: parseFloat(String(suscripcion.precio_pagado)) - multasPendientes,
                multasPendientes,
                precioTotal: parseFloat(String(suscripcion.precio_pagado)),
                referencia: suscripcion.referencia_wompi,
                montoEnCentavos,
                firmaIntegridad,
                publicKey: wompiService.getPublicKey(),
                moneda: 'COP',
            },
        });
    }
    catch (error) {
        console.error('Error al iniciar pago de suscripción:', error);
        res.status(500).json({ error: error.message || 'Error al iniciar pago' });
    }
};
exports.iniciarPago = iniciarPago;
const miPlan = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const suscripcion = await suscripcionService.obtenerPlanActivo(usuarioId);
        if (!suscripcion) {
            return res.json({ success: true, data: null });
        }
        const sesionesRestantes = suscripcion.sesiones_incluidas - suscripcion.sesiones_usadas;
        const diasRestantes = Math.max(0, Math.ceil((new Date(suscripcion.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        res.json({
            success: true,
            data: {
                id: suscripcion.id,
                plan: suscripcion.plan,
                sesionesIncluidas: suscripcion.sesiones_incluidas,
                sesionesUsadas: suscripcion.sesiones_usadas,
                sesionesRestantes,
                fechaInicio: suscripcion.fecha_inicio,
                fechaFin: suscripcion.fecha_fin,
                diasRestantes,
            },
        });
    }
    catch (error) {
        console.error('Error al obtener mi plan:', error);
        res.status(500).json({ error: error.message || 'Error al obtener plan' });
    }
};
exports.miPlan = miPlan;
const historial = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const lista = await suscripcionService.obtenerHistorial(usuarioId);
        res.json({ success: true, data: lista });
    }
    catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: error.message || 'Error al obtener historial' });
    }
};
exports.historial = historial;
const confirmarSuscripcionManual = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden confirmar suscripciones' });
        }
        const { referencia } = req.params;
        if (!referencia) {
            return res.status(400).json({ error: 'Referencia requerida' });
        }
        const subActualizada = await suscripcionService.confirmarPago(referencia);
        res.json({
            success: true,
            message: `Suscripción ${subActualizada.plan} confirmada`,
            data: subActualizada,
        });
    }
    catch (error) {
        console.error('Error al confirmar suscripción manual:', error);
        res.status(500).json({ error: error.message || 'Error al confirmar suscripción' });
    }
};
exports.confirmarSuscripcionManual = confirmarSuscripcionManual;
const listarSuscripcionesAdmin = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver suscripciones' });
        }
        const { email, plan, estado, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = [];
        const params = [];
        let idx = 1;
        if (email && String(email).trim() !== '') {
            where.push(`u.email ILIKE $${idx}`);
            params.push(`%${String(email).trim()}%`);
            idx++;
        }
        if (plan && ['bienestar', 'refugio', 'santuario'].includes(String(plan))) {
            where.push(`s.plan = $${idx}`);
            params.push(String(plan));
            idx++;
        }
        if (estado && ['activa', 'vencida', 'cancelada'].includes(String(estado))) {
            where.push(`s.estado = $${idx}`);
            params.push(String(estado));
            idx++;
        }
        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const query = `
      SELECT
        s.id, s.usuario_id, s.plan, s.sesiones_incluidas, s.sesiones_usadas,
        s.precio_pagado, s.fecha_inicio, s.fecha_fin,
        s.estado, s.estado_pago, s.pagado_at, s.created_at,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email
      FROM suscripciones s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
        const paramsConPaginacion = [...params, Number(limit), offset];
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM suscripciones s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      ${whereClause}
    `;
        const [result, countResult] = await Promise.all([
            connection_1.pool.query(query, paramsConPaginacion),
            connection_1.pool.query(countQuery, params),
        ]);
        const totalItems = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalItems / Number(limit));
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error('Error al listar suscripciones:', error);
        res.status(500).json({ error: error.message || 'Error al listar suscripciones' });
    }
};
exports.listarSuscripcionesAdmin = listarSuscripcionesAdmin;
const metricasSuscripcionesAdmin = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores' });
        }
        const porPlanQuery = await connection_1.pool.query(`
      SELECT plan, COUNT(*)::int AS total
      FROM suscripciones
      WHERE estado = 'activa' AND estado_pago = 'pagado' AND fecha_fin > NOW()
      GROUP BY plan
    `);
        const facturadoQuery = await connection_1.pool.query(`
      SELECT COALESCE(SUM(precio_pagado), 0) AS total,
             COUNT(*)::int AS cantidad
      FROM suscripciones
      WHERE estado_pago = 'pagado'
        AND pagado_at >= date_trunc('month', NOW())
        AND pagado_at < date_trunc('month', NOW()) + INTERVAL '1 month'
    `);
        const activasQuery = await connection_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM suscripciones
      WHERE estado = 'activa' AND estado_pago = 'pagado' AND fecha_fin > NOW()
    `);
        const porPlan = { bienestar: 0, refugio: 0, santuario: 0 };
        for (const row of porPlanQuery.rows) {
            porPlan[row.plan] = row.total;
        }
        res.json({
            success: true,
            data: {
                activas: activasQuery.rows[0].total,
                porPlan,
                facturadoMes: parseFloat(facturadoQuery.rows[0].total),
                cantidadPagadaMes: facturadoQuery.rows[0].cantidad,
            },
        });
    }
    catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({ error: error.message || 'Error al obtener métricas' });
    }
};
exports.metricasSuscripcionesAdmin = metricasSuscripcionesAdmin;
//# sourceMappingURL=suscripcionesController.js.map