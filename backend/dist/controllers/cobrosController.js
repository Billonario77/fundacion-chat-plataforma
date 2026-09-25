"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.condonarMulta = exports.generarFirmaPagoSesion = exports.obtenerCupones = exports.marcarUsuarioExento = exports.asignarUsuarioAEntidad = exports.obtenerResumenEntidad = exports.obtenerEntidades = exports.validarCupon = exports.crearCupon = exports.crearEntidad = exports.obtenerCobros = exports.obtenerEstadisticasCobros = exports.obtenerCobroPorTurno = exports.registrarPagoManual = exports.confirmarPago = exports.verificarPagoTurno = exports.calcularCostoTurno = void 0;
const pagoService_1 = require("../services/pagoService");
const cuponService_1 = require("../services/cuponService");
const entidadService_1 = require("../services/entidadService");
const connection_1 = require("../database/connection");
const wompiService_1 = require("../services/wompiService");
const pagoService = new pagoService_1.PagoService(connection_1.pool);
const cuponService = new cuponService_1.CuponService(connection_1.pool);
const entidadService = new entidadService_1.EntidadService(connection_1.pool);
const wompiService = new wompiService_1.WompiService();
const calcularCostoTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const { codigoCupon } = req.body;
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const turnoQuery = await connection_1.pool.query(`SELECT * FROM turnos WHERE id = $1`, [turnoId]);
        const turno = turnoQuery.rows[0];
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        if (turno.usuario_id !== usuarioId && req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para ver este turno' });
        }
        if (!turno.guia_id) {
            return res.status(400).json({ error: 'El turno no tiene guía asignado' });
        }
        const duracion = turno.duracion_solicitada || 60;
        const resultado = await pagoService.calcularCosto({
            usuarioId,
            guiaId: turno.guia_id,
            turnoId,
            duracionMinutos: duracion,
            codigoCupon
        });
        console.log('📌 Resultado del cálculo:', resultado);
        res.json({
            success: true,
            data: resultado
        });
    }
    catch (error) {
        console.error('Error al calcular costo:', error);
        res.status(500).json({ error: error.message || 'Error al calcular costo' });
    }
};
exports.calcularCostoTurno = calcularCostoTurno;
const verificarPagoTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const turnoQuery = await connection_1.pool.query(`SELECT * FROM turnos WHERE id = $1`, [turnoId]);
        const turno = turnoQuery.rows[0];
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        const esAdmin = req.user?.rol === 'admin';
        const esGuia = req.user?.rol === 'guia' && turno.guia_id === usuarioId;
        const esUsuario = turno.usuario_id === usuarioId;
        if (!esAdmin && !esGuia && !esUsuario) {
            return res.status(403).json({ error: 'No tienes permiso para ver este turno' });
        }
        const resultado = await pagoService.verificarPagoTurno(turnoId);
        res.json({
            success: true,
            data: resultado
        });
    }
    catch (error) {
        console.error('Error al verificar pago:', error);
        res.status(500).json({ error: error.message || 'Error al verificar pago' });
    }
};
exports.verificarPagoTurno = verificarPagoTurno;
const confirmarPago = async (req, res) => {
    try {
        const { turnoId, metodoPago } = req.body;
        if (!turnoId || !metodoPago) {
            return res.status(400).json({ error: 'Turno ID y método de pago son requeridos' });
        }
        const cobro = await pagoService.confirmarPago(turnoId, metodoPago);
        res.json({
            success: true,
            message: 'Pago confirmado exitosamente',
            data: cobro
        });
    }
    catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({ error: error.message || 'Error al confirmar pago' });
    }
};
exports.confirmarPago = confirmarPago;
const registrarPagoManual = async (req, res) => {
    try {
        const { turnoId, metodoPago, comprobanteUrl } = req.body;
        const adminId = req.user?.id;
        if (!adminId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden registrar pagos manuales' });
        }
        if (!turnoId || !metodoPago) {
            return res.status(400).json({ error: 'Turno ID y método de pago son requeridos' });
        }
        const cobro = await pagoService.registrarPagoManual({
            turnoId,
            metodoPago,
            comprobanteUrl,
            adminId
        });
        res.json({
            success: true,
            message: 'Pago registrado exitosamente',
            data: cobro
        });
    }
    catch (error) {
        console.error('Error al registrar pago manual:', error);
        res.status(500).json({ error: error.message || 'Error al registrar pago manual' });
    }
};
exports.registrarPagoManual = registrarPagoManual;
const obtenerCobroPorTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const turnoQuery = await connection_1.pool.query(`SELECT * FROM turnos WHERE id = $1`, [turnoId]);
        const turno = turnoQuery.rows[0];
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        const esAdmin = req.user?.rol === 'admin';
        const esGuia = req.user?.rol === 'guia' && turno.guia_id === usuarioId;
        const esUsuario = turno.usuario_id === usuarioId;
        if (!esAdmin && !esGuia && !esUsuario) {
            return res.status(403).json({ error: 'No tienes permiso para ver este cobro' });
        }
        const cobro = await pagoService.obtenerCobroPorTurno(turnoId);
        res.json({
            success: true,
            data: cobro
        });
    }
    catch (error) {
        console.error('Error al obtener cobro:', error);
        res.status(500).json({ error: error.message || 'Error al obtener cobro' });
    }
};
exports.obtenerCobroPorTurno = obtenerCobroPorTurno;
const obtenerEstadisticasCobros = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver estadísticas' });
        }
        const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END) as fallidos,
        SUM(CASE WHEN estado = 'exento' THEN 1 ELSE 0 END) as exentos,
        SUM(CASE WHEN estado = 'consumido_bolsa' THEN 1 ELSE 0 END) as consumidos_bolsa,
        COALESCE(SUM(total), 0) as total_recaudado
      FROM cobros c
      INNER JOIN usuarios u ON u.id = c.usuario_id AND u.rol = 'usuario'
    `;
        const result = await connection_1.pool.query(query);
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
    }
};
exports.obtenerEstadisticasCobros = obtenerEstadisticasCobros;
const obtenerCobros = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver cobros' });
        }
        const { estado, fecha_desde, fecha_hasta, guia_id, usuario_id } = req.query;
        let query = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        g.nombre as guia_nombre,
        t.fecha_programada,
        t.estado as turno_estado
      FROM cobros c
      INNER JOIN usuarios u ON u.id = c.usuario_id AND u.rol = 'usuario'
      LEFT JOIN usuarios g ON g.id = c.guia_id
      LEFT JOIN turnos t ON t.id = c.turno_id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (estado) {
            query += ` AND c.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        if (fecha_desde) {
            query += ` AND c.created_at >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }
        if (fecha_hasta) {
            query += ` AND c.created_at <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }
        if (guia_id) {
            query += ` AND c.guia_id = $${paramIndex}`;
            params.push(guia_id);
            paramIndex++;
        }
        if (usuario_id) {
            query += ` AND c.usuario_id = $${paramIndex}`;
            params.push(usuario_id);
            paramIndex++;
        }
        query += ` ORDER BY c.created_at DESC LIMIT 500`;
        const result = await connection_1.pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error al obtener cobros:', error);
        res.status(500).json({ error: error.message || 'Error al obtener cobros' });
    }
};
exports.obtenerCobros = obtenerCobros;
const crearEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden crear entidades' });
        }
        const { nombre, tipo, identificador, contactoNombre, contactoEmail, contactoTelefono, descuentoPorcentaje, bolsaHorasInicial } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const entidad = await entidadService.crearEntidad({
            nombre,
            tipo: tipo || 'empresa',
            identificador,
            contactoNombre,
            contactoEmail,
            contactoTelefono,
            descuentoPorcentaje,
            bolsaHorasInicial
        });
        res.json({
            success: true,
            message: 'Entidad creada exitosamente',
            data: entidad
        });
    }
    catch (error) {
        console.error('Error al crear entidad:', error);
        res.status(500).json({ error: error.message || 'Error al crear entidad' });
    }
};
exports.crearEntidad = crearEntidad;
const crearCupon = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden crear cupones' });
        }
        const { descripcion, tipo, valor, entidadId, aplicaA, fechaInicio, fechaExpiracion, usosMaximos } = req.body;
        if (!descripcion || !tipo || valor === undefined) {
            return res.status(400).json({ error: 'Descripción, tipo y valor son requeridos' });
        }
        const cupon = await cuponService.crearCupon({
            descripcion,
            tipo,
            valor,
            entidadId,
            aplicaA,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
            fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : undefined,
            usosMaximos
        });
        res.json({
            success: true,
            message: 'Cupón creado exitosamente',
            data: cupon
        });
    }
    catch (error) {
        console.error('Error al crear cupón:', error);
        res.status(500).json({ error: error.message || 'Error al crear cupón' });
    }
};
exports.crearCupon = crearCupon;
const validarCupon = async (req, res) => {
    try {
        const { codigo } = req.params;
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const cupon = await cuponService.validarCupon(codigo, usuarioId);
        if (!cupon) {
            return res.status(404).json({ error: 'Cupón no válido o expirado' });
        }
        res.json({
            success: true,
            data: cupon
        });
    }
    catch (error) {
        console.error('Error al validar cupón:', error);
        res.status(500).json({ error: error.message || 'Error al validar cupón' });
    }
};
exports.validarCupon = validarCupon;
const obtenerEntidades = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver entidades' });
        }
        const entidades = await entidadService.obtenerTodas();
        res.json({
            success: true,
            data: entidades
        });
    }
    catch (error) {
        console.error('Error al obtener entidades:', error);
        res.status(500).json({ error: error.message || 'Error al obtener entidades' });
    }
};
exports.obtenerEntidades = obtenerEntidades;
const obtenerResumenEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver este resumen' });
        }
        const { entidadId } = req.params;
        const resumen = await entidadService.obtenerResumenEntidad(entidadId);
        res.json({
            success: true,
            data: resumen
        });
    }
    catch (error) {
        console.error('Error al obtener resumen:', error);
        res.status(500).json({ error: error.message || 'Error al obtener resumen' });
    }
};
exports.obtenerResumenEntidad = obtenerResumenEntidad;
const asignarUsuarioAEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden asignar usuarios' });
        }
        const { usuarioId, entidadId } = req.body;
        if (!usuarioId || !entidadId) {
            return res.status(400).json({ error: 'Usuario ID y Entidad ID son requeridos' });
        }
        await entidadService.asignarUsuarioAEntidad(usuarioId, entidadId);
        res.json({
            success: true,
            message: 'Usuario asignado a entidad exitosamente'
        });
    }
    catch (error) {
        console.error('Error al asignar usuario:', error);
        res.status(500).json({ error: error.message || 'Error al asignar usuario' });
    }
};
exports.asignarUsuarioAEntidad = asignarUsuarioAEntidad;
const marcarUsuarioExento = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden marcar usuarios como exentos' });
        }
        const { usuarioId, motivo } = req.body;
        if (!usuarioId || !motivo) {
            return res.status(400).json({ error: 'Usuario ID y motivo son requeridos' });
        }
        await entidadService.marcarUsuarioExento(usuarioId, motivo);
        res.json({
            success: true,
            message: 'Usuario marcado como exento exitosamente'
        });
    }
    catch (error) {
        console.error('Error al marcar usuario exento:', error);
        res.status(500).json({ error: error.message || 'Error al marcar usuario exento' });
    }
};
exports.marcarUsuarioExento = marcarUsuarioExento;
const obtenerCupones = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver cupones' });
        }
        const query = `
      SELECT * FROM cupones 
      ORDER BY created_at DESC
    `;
        const result = await connection_1.pool.query(query);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error al obtener cupones:', error);
        res.status(500).json({ error: error.message || 'Error al obtener cupones' });
    }
};
exports.obtenerCupones = obtenerCupones;
const generarFirmaPagoSesion = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const turnoQuery = await connection_1.pool.query(`SELECT t.*, c.id as cobro_id, c.total, c.estado as cobro_estado, c.referencia_wompi
       FROM turnos t
       LEFT JOIN cobros c ON c.turno_id = t.id
       WHERE t.id = $1`, [turnoId]);
        if (turnoQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        const turno = turnoQuery.rows[0];
        if (turno.usuario_id !== usuarioId) {
            return res.status(403).json({ error: 'No tienes permiso para pagar este turno' });
        }
        if (turno.estado !== 'pendiente_pago') {
            return res.status(400).json({ error: 'Este turno no requiere pago' });
        }
        if (!turno.cobro_id) {
            return res.status(404).json({ error: 'No se encontró el cobro asociado al turno' });
        }
        if (turno.cobro_estado === 'pagado') {
            return res.status(400).json({ error: 'Este turno ya fue pagado' });
        }
        let referencia = turno.referencia_wompi;
        if (!referencia) {
            referencia = wompiService.generarReferencia();
            await connection_1.pool.query(`UPDATE cobros SET referencia_wompi = $1 WHERE id = $2`, [referencia, turno.cobro_id]);
        }
        const montoEnCentavos = Math.round(parseFloat(turno.total) * 100);
        const firmaIntegridad = wompiService.generarFirmaIntegridad(referencia, montoEnCentavos, 'COP');
        res.json({
            success: true,
            data: {
                referencia,
                montoEnCentavos,
                firmaIntegridad,
                publicKey: wompiService.getPublicKey(),
                moneda: 'COP',
                monto: parseFloat(turno.total),
                turnoId: turnoId,
                cobroId: turno.cobro_id
            }
        });
    }
    catch (error) {
        console.error('Error al generar firma de pago de sesión:', error);
        res.status(500).json({ error: error.message || 'Error al generar firma' });
    }
};
exports.generarFirmaPagoSesion = generarFirmaPagoSesion;
const condonarMulta = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden condonar multas' });
        }
        const adminId = req.user.id;
        const { multaId } = req.params;
        if (!multaId) {
            return res.status(400).json({ error: 'ID de multa requerido' });
        }
        const client = await connection_1.pool.connect();
        try {
            await client.query('BEGIN');
            const multaQuery = await client.query(`SELECT id, usuario_id, total, estado, incluida_en_cobro_id
         FROM cobros
         WHERE id = $1 AND tipo = 'multa'`, [multaId]);
            if (multaQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Multa no encontrada' });
            }
            const multa = multaQuery.rows[0];
            if (multa.estado !== 'pendiente') {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Solo se pueden condonar multas en estado pendiente. Esta está en "${multa.estado}".`
                });
            }
            const montoMulta = parseFloat(multa.total);
            if (multa.incluida_en_cobro_id) {
                const sesionQuery = await client.query(`SELECT id, total, monto_multas, estado
           FROM cobros
           WHERE id = $1 AND tipo = 'sesion'`, [multa.incluida_en_cobro_id]);
                if (sesionQuery.rows.length > 0) {
                    const sesion = sesionQuery.rows[0];
                    if (sesion.estado === 'pendiente') {
                        const nuevoTotal = Math.max(0, parseFloat(sesion.total) - montoMulta);
                        const nuevoMontoMultas = Math.max(0, parseFloat(sesion.monto_multas) - montoMulta);
                        await client.query(`UPDATE cobros
               SET total = $1, monto_multas = $2, updated_at = NOW()
               WHERE id = $3`, [nuevoTotal, nuevoMontoMultas, sesion.id]);
                        console.log(`💰 Sesión ${sesion.id} ajustada: total $${sesion.total} → $${nuevoTotal}`);
                    }
                }
            }
            await client.query(`UPDATE cobros
         SET estado = 'condonada',
             incluida_en_cobro_id = NULL,
             creado_por = $1,
             updated_at = NOW()
         WHERE id = $2`, [adminId, multaId]);
            await client.query(`INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
         VALUES ($1, $2, $3, NOW())`, [
                multa.usuario_id,
                'multa_condonada',
                JSON.stringify({ multa_id: multaId, monto: montoMulta, admin_id: adminId })
            ]);
            await client.query('COMMIT');
            console.log(`✅ Multa ${multaId} condonada por admin ${adminId}`);
            res.json({
                success: true,
                message: 'Multa condonada exitosamente',
                montoCondonado: montoMulta
            });
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error al condonar multa:', error);
        res.status(500).json({ error: error.message || 'Error al condonar multa' });
    }
};
exports.condonarMulta = condonarMulta;
//# sourceMappingURL=cobrosController.js.map