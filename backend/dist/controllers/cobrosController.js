"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.condonarMulta = exports.generarFirmaPagoSesion = exports.obtenerCupones = exports.marcarUsuarioExento = exports.asignarUsuariosMasivo = exports.asignarUsuarioAEntidadPorEmail = exports.asignarUsuarioAEntidad = exports.obtenerConsumoPeriodo = exports.agregarHorasBolsa = exports.obtenerResumenEntidad = exports.obtenerEntidades = exports.generarCuponParaEntidad = exports.obtenerCuponesDeEntidad = exports.canjearCuponBolsa = exports.validarCupon = exports.crearCupon = exports.crearEntidad = exports.obtenerCobros = exports.obtenerEstadisticasCobros = exports.obtenerCobroPorTurno = exports.registrarPagoManual = exports.confirmarPago = exports.verificarPagoTurno = exports.calcularCostoTurno = void 0;
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
        const mensaje = error?.message || '';
        if (mensaje.startsWith('CUPON_YA_USADO:')) {
            const textoLimpio = mensaje.replace('CUPON_YA_USADO:', '').trim();
            return res.status(400).json({
                error: textoLimpio,
                codigoError: 'cupon_ya_usado'
            });
        }
        res.status(500).json({ error: mensaje || 'Error al calcular costo' });
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
        const { nombre, tipo, modalidad, identificador, contactoNombre, contactoEmail, contactoTelefono, bolsaHorasInicial, dominioCorporativo } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        if (!modalidad || !['descuento', 'bolsa'].includes(modalidad)) {
            return res.status(400).json({ error: 'La modalidad debe ser "descuento" o "bolsa"' });
        }
        if (modalidad === 'bolsa' && !dominioCorporativo) {
            return res.status(400).json({ error: 'Los convenios de bolsa requieren un dominio corporativo' });
        }
        const entidad = await entidadService.crearEntidad({
            nombre,
            tipo: tipo || 'empresa',
            modalidad,
            identificador,
            contactoNombre,
            contactoEmail,
            contactoTelefono,
            bolsaHorasInicial: modalidad === 'bolsa' ? bolsaHorasInicial : 0,
            dominioCorporativo: modalidad === 'bolsa' ? dominioCorporativo : undefined
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
const canjearCuponBolsa = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const { codigo } = req.body;
        if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
            return res.status(400).json({ error: 'El código del cupón es requerido' });
        }
        const resultado = await cuponService.canjearCuponBolsa(codigo.trim(), usuarioId);
        if (!resultado.ok) {
            const statusPorError = {
                no_encontrado: 404,
                no_bolsa: 400,
                sin_entidad: 400,
                entidad_invalida: 400,
                dominio_no_configurado: 500,
                dominio_no_coincide: 403,
                ya_vinculado: 409,
                sin_usos: 400
            };
            const status = statusPorError[resultado.codigoError] || 400;
            return res.status(status).json({
                error: resultado.mensaje,
                codigoError: resultado.codigoError
            });
        }
        res.json({
            success: true,
            message: `Te has vinculado al convenio "${resultado.entidad.nombre}". Tus próximas sesiones consumirán de la bolsa de horas.`,
            data: {
                entidad: {
                    id: resultado.entidad.id,
                    nombre: resultado.entidad.nombre,
                    bolsa_horas_restantes: resultado.entidad.bolsa_horas_restantes
                }
            }
        });
    }
    catch (error) {
        console.error('Error al canjear cupón de bolsa:', error);
        res.status(500).json({ error: error.message || 'Error al canjear el cupón' });
    }
};
exports.canjearCuponBolsa = canjearCuponBolsa;
const obtenerCuponesDeEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver cupones' });
        }
        const { entidadId } = req.params;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        const cupones = await cuponService.obtenerCuponesDeEntidad(entidadId);
        res.json({
            success: true,
            data: cupones
        });
    }
    catch (error) {
        console.error('Error al obtener cupones de entidad:', error);
        res.status(500).json({ error: error.message || 'Error al obtener cupones' });
    }
};
exports.obtenerCuponesDeEntidad = obtenerCuponesDeEntidad;
const generarCuponParaEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden crear cupones' });
        }
        const { entidadId } = req.params;
        const { descripcion, valor, usosMaximos, fechaExpiracion, codigo } = req.body;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        const entidad = await entidadService.obtenerEntidad(entidadId);
        if (!entidad) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }
        if (entidad.modalidad !== 'descuento') {
            return res.status(400).json({
                error: 'Solo se pueden generar cupones de descuento para convenios de modalidad "descuento".'
            });
        }
        if (valor === undefined || valor === null || Number(valor) <= 0) {
            return res.status(400).json({ error: 'El valor del descuento debe ser mayor a 0' });
        }
        if (Number(valor) > 100) {
            return res.status(400).json({ error: 'El descuento no puede superar el 100%' });
        }
        const cupon = await cuponService.crearCupon({
            descripcion: descripcion || `Cupón ${entidad.nombre}`,
            tipo: 'porcentaje',
            valor: Number(valor),
            codigo: codigo && String(codigo).trim() !== '' ? String(codigo) : undefined,
            entidadId,
            aplicaA: 'todos',
            fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : undefined,
            usosMaximos: usosMaximos ? Number(usosMaximos) : 100
        });
        await connection_1.pool.query(`INSERT INTO auditoria_logs (accion, detalles, created_at)
       VALUES ($1, $2, NOW())`, [
            'generar_cupon_convenio',
            JSON.stringify({
                entidad_id: entidadId,
                cupon_id: cupon.id,
                codigo: cupon.codigo,
                codigo_manual: !!(codigo && String(codigo).trim() !== ''),
                valor: cupon.valor,
                admin_id: req.user?.id
            })
        ]);
        res.status(201).json({
            success: true,
            message: `Cupón generado: ${cupon.codigo}`,
            data: cupon
        });
    }
    catch (error) {
        console.error('Error al generar cupón para entidad:', error);
        const mensaje = error?.message || '';
        const esErrorValidacion = mensaje.includes('ya está en uso') ||
            mensaje.includes('solo puede contener') ||
            mensaje.includes('debe tener entre') ||
            mensaje.includes('No se pudo generar');
        if (esErrorValidacion) {
            return res.status(400).json({ error: mensaje });
        }
        res.status(500).json({ error: mensaje || 'Error al generar cupón' });
    }
};
exports.generarCuponParaEntidad = generarCuponParaEntidad;
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
const agregarHorasBolsa = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden agregar horas' });
        }
        const { entidadId } = req.params;
        const { horas } = req.body;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        const horasNum = Number(horas);
        if (!horasNum || isNaN(horasNum) || horasNum <= 0) {
            return res.status(400).json({ error: 'Debes indicar una cantidad de horas mayor a 0' });
        }
        const entidad = await entidadService.agregarHorasBolsa(entidadId, horasNum);
        if (!entidad) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }
        await connection_1.pool.query(`INSERT INTO auditoria_logs (accion, detalles, created_at)
       VALUES ($1, $2, NOW())`, [
            'agregar_horas_bolsa',
            JSON.stringify({
                entidad_id: entidadId,
                horas_agregadas: horasNum,
                admin_id: req.user?.id
            })
        ]);
        res.json({
            success: true,
            message: `${horasNum} hora(s) agregada(s) a la bolsa`,
            data: entidad
        });
    }
    catch (error) {
        console.error('Error al agregar horas a la bolsa:', error);
        res.status(500).json({ error: error.message || 'Error al agregar horas' });
    }
};
exports.agregarHorasBolsa = agregarHorasBolsa;
const obtenerConsumoPeriodo = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden ver el reporte de consumo' });
        }
        const { entidadId } = req.params;
        const { desde, hasta } = req.query;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        if (!desde || !hasta) {
            return res.status(400).json({ error: 'Los parámetros "desde" y "hasta" son requeridos (formato YYYY-MM-DD)' });
        }
        const fechaDesde = new Date(`${desde}T00:00:00.000Z`);
        const fechaHasta = new Date(`${hasta}T23:59:59.999Z`);
        if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
            return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
        }
        if (fechaDesde > fechaHasta) {
            return res.status(400).json({ error: 'La fecha "desde" no puede ser posterior a "hasta"' });
        }
        const [entidad, consumo] = await Promise.all([
            entidadService.obtenerEntidad(entidadId),
            entidadService.obtenerConsumoPeriodo(entidadId, fechaDesde, fechaHasta)
        ]);
        if (!entidad) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }
        const configPrecio = await connection_1.pool.query(`SELECT valor FROM configuracion WHERE clave = 'precio_sesion'`);
        const precioSesion = parseFloat(configPrecio.rows[0]?.valor || '100000');
        res.json({
            success: true,
            data: {
                entidad: {
                    id: entidad.id,
                    nombre: entidad.nombre,
                    identificador: entidad.identificador,
                    descuento_porcentaje: entidad.descuento_porcentaje,
                    bolsa_horas_restantes: entidad.bolsa_horas_restantes
                },
                periodo: {
                    desde: fechaDesde.toISOString(),
                    hasta: fechaHasta.toISOString()
                },
                total_horas: consumo.totalHoras,
                precio_sesion_referencia: precioSesion,
                consumos: consumo.consumos
            }
        });
    }
    catch (error) {
        console.error('Error al obtener consumo del período:', error);
        res.status(500).json({ error: error.message || 'Error al obtener consumo' });
    }
};
exports.obtenerConsumoPeriodo = obtenerConsumoPeriodo;
const asignarUsuarioAEntidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden asignar usuarios' });
        }
        const { usuarioId, entidadId } = req.body;
        if (!usuarioId) {
            return res.status(400).json({ error: 'Usuario ID es requerido' });
        }
        const entidadIdFinal = entidadId && String(entidadId).trim() !== '' ? String(entidadId) : null;
        await entidadService.asignarUsuarioAEntidad(usuarioId, entidadIdFinal);
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
const asignarUsuarioAEntidadPorEmail = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden asignar usuarios' });
        }
        const { entidadId } = req.params;
        const { email } = req.body;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        if (!email || String(email).trim() === '') {
            return res.status(400).json({ error: 'El email es requerido' });
        }
        const entidad = await entidadService.obtenerEntidad(entidadId);
        if (!entidad) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }
        const resultado = await entidadService.asignarUsuarioPorEmail(String(email), entidadId);
        if (!resultado.ok) {
            const statusPorMotivo = {
                formato_invalido: 400,
                ya_vinculado: 409,
                otro_convenio: 409,
                ya_autorizado: 409,
                autorizado_otro_convenio: 409
            };
            const status = statusPorMotivo[resultado.motivo] || 400;
            return res.status(status).json({ error: resultado.mensaje, motivo: resultado.motivo });
        }
        if (resultado.tipo === 'vinculado') {
            return res.json({
                success: true,
                tipo: 'vinculado',
                message: `${resultado.usuario.email} vinculado al convenio`,
                data: resultado.usuario
            });
        }
        return res.json({
            success: true,
            tipo: 'pendiente',
            message: `${resultado.email} guardado. Cuando se registre, quedará vinculado automáticamente.`
        });
    }
    catch (error) {
        console.error('Error al asignar usuario por email:', error);
        res.status(500).json({ error: error.message || 'Error al asignar usuario' });
    }
};
exports.asignarUsuarioAEntidadPorEmail = asignarUsuarioAEntidadPorEmail;
const asignarUsuariosMasivo = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden asignar usuarios' });
        }
        const { entidadId } = req.params;
        const { emails } = req.body;
        if (!entidadId) {
            return res.status(400).json({ error: 'Entidad ID es requerido' });
        }
        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'Debes enviar una lista de emails' });
        }
        if (emails.length > 500) {
            return res.status(400).json({ error: 'Máximo 500 emails por carga' });
        }
        const entidad = await entidadService.obtenerEntidad(entidadId);
        if (!entidad) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }
        const emailsUnicos = [];
        const vistos = new Set();
        for (const raw of emails) {
            const e = String(raw || '').trim().toLowerCase();
            if (!e || vistos.has(e))
                continue;
            vistos.add(e);
            emailsUnicos.push(e);
        }
        const resultados = [];
        let vinculados = 0;
        let pendientes = 0;
        let fallidos = 0;
        for (const email of emailsUnicos) {
            try {
                const r = await entidadService.asignarUsuarioPorEmail(email, entidadId);
                if (r.ok) {
                    if (r.tipo === 'vinculado') {
                        vinculados++;
                        resultados.push({ email, ok: true, tipo: 'vinculado' });
                    }
                    else {
                        pendientes++;
                        resultados.push({ email, ok: true, tipo: 'pendiente' });
                    }
                }
                else {
                    fallidos++;
                    resultados.push({ email, ok: false, motivo: r.motivo, mensaje: r.mensaje });
                }
            }
            catch (err) {
                fallidos++;
                resultados.push({ email, ok: false, motivo: 'error', mensaje: err.message || 'Error' });
            }
        }
        res.json({
            success: true,
            message: `Carga completada: ${vinculados} vinculados, ${pendientes} pendientes de registro, ${fallidos} con problemas`,
            data: {
                total: emailsUnicos.length,
                vinculados,
                pendientes,
                fallidos,
                resultados
            }
        });
    }
    catch (error) {
        console.error('Error en asignación masiva:', error);
        res.status(500).json({ error: error.message || 'Error en asignación masiva' });
    }
};
exports.asignarUsuariosMasivo = asignarUsuariosMasivo;
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
        const turnoQuery = await connection_1.pool.query(`SELECT * FROM turnos WHERE id = $1`, [turnoId]);
        if (turnoQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        const turno = turnoQuery.rows[0];
        const cobroQuery = await connection_1.pool.query(`SELECT id, total, estado, referencia_wompi
       FROM cobros
       WHERE turno_id = $1 AND tipo = 'sesion'
       ORDER BY created_at DESC
       LIMIT 1`, [turnoId]);
        const cobroRow = cobroQuery.rows[0];
        turno.cobro_id = cobroRow?.id || null;
        turno.total = cobroRow?.total || null;
        turno.cobro_estado = cobroRow?.estado || null;
        turno.referencia_wompi = cobroRow?.referencia_wompi || null;
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