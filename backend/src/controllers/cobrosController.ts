import { Response } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../middleware/auth';
import { PagoService } from '../services/pagoService';
import { CuponService } from '../services/cuponService';
import { EntidadService } from '../services/entidadService';
import { pool } from '../database/connection';
import { WompiService } from '../services/wompiService';

const pagoService = new PagoService(pool);
const cuponService = new CuponService(pool);
const entidadService = new EntidadService(pool);
const wompiService = new WompiService();

// ============================================
// CALCULAR COSTO DE TURNO
// ============================================
export const calcularCostoTurno = async (req: AuthRequest, res: Response) => {
  try {
    const { turnoId } = req.params;
    const { codigoCupon } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const turnoQuery = await pool.query(
      `SELECT * FROM turnos WHERE id = $1`,
      [turnoId]
    );
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

  } catch (error: any) {
    console.error('Error al calcular costo:', error);

    // Errores controlados con prefijo: mapear a 400 en vez de 500
    const mensaje: string = error?.message || '';
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

// ============================================
// VERIFICAR ESTADO DE PAGO
// ============================================
export const verificarPagoTurno = async (req: AuthRequest, res: Response) => {
  try {
    const { turnoId } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const turnoQuery = await pool.query(
      `SELECT * FROM turnos WHERE id = $1`,
      [turnoId]
    );
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

  } catch (error: any) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({ error: error.message || 'Error al verificar pago' });
  }
};

// ============================================
// CONFIRMAR PAGO
// ============================================
export const confirmarPago = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: error.message || 'Error al confirmar pago' });
  }
};

// ============================================
// REGISTRAR PAGO MANUAL (Admin)
// ============================================
export const registrarPagoManual = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al registrar pago manual:', error);
    res.status(500).json({ error: error.message || 'Error al registrar pago manual' });
  }
};

// ============================================
// OBTENER COBRO POR TURNO
// ============================================
export const obtenerCobroPorTurno = async (req: AuthRequest, res: Response) => {
  try {
    const { turnoId } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const turnoQuery = await pool.query(
      `SELECT * FROM turnos WHERE id = $1`,
      [turnoId]
    );
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

  } catch (error: any) {
    console.error('Error al obtener cobro:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cobro' });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DE COBROS (Admin)
// ============================================
export const obtenerEstadisticasCobros = async (req: AuthRequest, res: Response) => {
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
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
};

// ============================================
// OBTENER TODOS LOS COBROS (Admin - Historial)
// ============================================
export const obtenerCobros = async (req: AuthRequest, res: Response) => {
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
    const params: any[] = [];
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

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error al obtener cobros:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cobros' });
  }
};

// ============================================
// CREAR ENTIDAD (Admin)
// ============================================
export const crearEntidad = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear entidades' });
    }

    const { 
      nombre, 
      tipo, 
      modalidad,
      identificador, 
      contactoNombre, 
      contactoEmail, 
      contactoTelefono, 
      bolsaHorasInicial,
      dominioCorporativo
    } = req.body;

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

  } catch (error: any) {
    console.error('Error al crear entidad:', error);
    res.status(500).json({ error: error.message || 'Error al crear entidad' });
  }
};

// ============================================
// CREAR CUPÓN (Admin)
// ============================================
export const crearCupon = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear cupones' });
    }

    const { 
      descripcion, 
      tipo, 
      valor, 
      entidadId, 
      aplicaA, 
      fechaInicio, 
      fechaExpiracion, 
      usosMaximos 
    } = req.body;

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

  } catch (error: any) {
    console.error('Error al crear cupón:', error);
    res.status(500).json({ error: error.message || 'Error al crear cupón' });
  }
};

// ============================================
// VALIDAR CUPÓN
// ============================================
export const validarCupon = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({ error: error.message || 'Error al validar cupón' });
  }
};


// ============================================
// CANJEAR CUPÓN DE BOLSA (Usuario)
// ============================================
export const canjearCuponBolsa = async (req: AuthRequest, res: Response) => {
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
      // Mapeo de código de error a status HTTP
      const statusPorError: Record<string, number> = {
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

  } catch (error: any) {
    console.error('Error al canjear cupón de bolsa:', error);
    res.status(500).json({ error: error.message || 'Error al canjear el cupón' });
  }
};


// ============================================
// OBTENER CUPONES DE UNA ENTIDAD (Admin)
// ============================================
export const obtenerCuponesDeEntidad = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al obtener cupones de entidad:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cupones' });
  }
};


// ============================================
// GENERAR CUPÓN PARA UNA ENTIDAD (Admin)
// ============================================
export const generarCuponParaEntidad = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear cupones' });
    }

    const { entidadId } = req.params;
    const { descripcion, valor, usosMaximos, fechaExpiracion, codigo } = req.body;

    if (!entidadId) {
      return res.status(400).json({ error: 'Entidad ID es requerido' });
    }

    // Validar entidad
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

    // Auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (accion, detalles, created_at)
       VALUES ($1, $2, NOW())`,
      [
        'generar_cupon_convenio',
        JSON.stringify({
          entidad_id: entidadId,
          cupon_id: cupon.id,
          codigo: cupon.codigo,
          codigo_manual: !!(codigo && String(codigo).trim() !== ''),
          valor: cupon.valor,
          admin_id: req.user?.id
        })
      ]
    );

    res.status(201).json({
      success: true,
      message: `Cupón generado: ${cupon.codigo}`,
      data: cupon
    });

  } catch (error: any) {
    console.error('Error al generar cupón para entidad:', error);

    // Errores de validación del service → 400 en vez de 500
    const mensaje: string = error?.message || '';
    const esErrorValidacion =
      mensaje.includes('ya está en uso') ||
      mensaje.includes('solo puede contener') ||
      mensaje.includes('debe tener entre') ||
      mensaje.includes('No se pudo generar');

    if (esErrorValidacion) {
      return res.status(400).json({ error: mensaje });
    }

    res.status(500).json({ error: mensaje || 'Error al generar cupón' });
  }
};


// ============================================
// OBTENER ENTIDADES (Admin)
// ============================================
export const obtenerEntidades = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver entidades' });
    }

    const entidades = await entidadService.obtenerTodas();

    res.json({
      success: true,
      data: entidades
    });

  } catch (error: any) {
    console.error('Error al obtener entidades:', error);
    res.status(500).json({ error: error.message || 'Error al obtener entidades' });
  }
};

// ============================================
// OBTENER RESUMEN DE ENTIDAD (Admin)
// ============================================
export const obtenerResumenEntidad = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: error.message || 'Error al obtener resumen' });
  }
};


// ============================================
// AGREGAR HORAS A LA BOLSA DE UNA ENTIDAD (Admin)
// ============================================
export const agregarHorasBolsa = async (req: AuthRequest, res: Response) => {
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

    // Auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (accion, detalles, created_at)
       VALUES ($1, $2, NOW())`,
      [
        'agregar_horas_bolsa',
        JSON.stringify({
          entidad_id: entidadId,
          horas_agregadas: horasNum,
          admin_id: req.user?.id
        })
      ]
    );

    res.json({
      success: true,
      message: `${horasNum} hora(s) agregada(s) a la bolsa`,
      data: entidad
    });

  } catch (error: any) {
    console.error('Error al agregar horas a la bolsa:', error);
    res.status(500).json({ error: error.message || 'Error al agregar horas' });
  }
};


// ============================================
// OBTENER CONSUMO DE UN PERÍODO (Admin - Reporte mensual)
// ============================================
export const obtenerConsumoPeriodo = async (req: AuthRequest, res: Response) => {
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

    // Parsear como inicio del día "desde" y fin del día "hasta" (en UTC, que es la zona de la BD)
    const fechaDesde = new Date(`${desde}T00:00:00.000Z`);
    const fechaHasta = new Date(`${hasta}T23:59:59.999Z`);

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
    }

    if (fechaDesde > fechaHasta) {
      return res.status(400).json({ error: 'La fecha "desde" no puede ser posterior a "hasta"' });
    }

    // Obtener entidad + consumo del período en paralelo
    const [entidad, consumo] = await Promise.all([
      entidadService.obtenerEntidad(entidadId),
      entidadService.obtenerConsumoPeriodo(entidadId, fechaDesde, fechaHasta)
    ]);

    if (!entidad) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    // Calcular el valor a cobrar a la empresa según el precio de sesión configurado
    const configPrecio = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'precio_sesion'`
    );
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

  } catch (error: any) {
    console.error('Error al obtener consumo del período:', error);
    res.status(500).json({ error: error.message || 'Error al obtener consumo' });
  }
};

// ============================================
// ASIGNAR USUARIO A ENTIDAD (Admin)
// ============================================
export const asignarUsuarioAEntidad = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden asignar usuarios' });
    }

    const { usuarioId, entidadId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: 'Usuario ID es requerido' });
    }

    // entidadId puede ser null o string vacío para desvincular al usuario
    const entidadIdFinal = entidadId && String(entidadId).trim() !== '' ? String(entidadId) : null;

    await entidadService.asignarUsuarioAEntidad(usuarioId, entidadIdFinal);

    res.json({
      success: true,
      message: 'Usuario asignado a entidad exitosamente'
    });

  } catch (error: any) {
    console.error('Error al asignar usuario:', error);
    res.status(500).json({ error: error.message || 'Error al asignar usuario' });
  }
};

// ============================================
// ASIGNAR USUARIO A ENTIDAD POR EMAIL (Admin)
// ============================================

export const asignarUsuarioAEntidadPorEmail = async (req: AuthRequest, res: Response) => {
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
      const statusPorMotivo: Record<string, number> = {
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

    // tipo 'pendiente'
    return res.json({
      success: true,
      tipo: 'pendiente',
      message: `${resultado.email} guardado. Cuando se registre, quedará vinculado automáticamente.`
    });

  } catch (error: any) {
    console.error('Error al asignar usuario por email:', error);
    res.status(500).json({ error: error.message || 'Error al asignar usuario' });
  }
};



// ============================================
// ASIGNACIÓN MASIVA DE USUARIOS A ENTIDAD (Admin)
// ============================================
export const asignarUsuariosMasivo = async (req: AuthRequest, res: Response) => {
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

    const emailsUnicos: string[] = [];
    const vistos = new Set<string>();
    for (const raw of emails) {
      const e = String(raw || '').trim().toLowerCase();
      if (!e || vistos.has(e)) continue;
      vistos.add(e);
      emailsUnicos.push(e);
    }

    const resultados: {
      email: string;
      ok: boolean;
      tipo?: 'vinculado' | 'pendiente';
      motivo?: string;
      mensaje?: string;
    }[] = [];

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
          } else {
            pendientes++;
            resultados.push({ email, ok: true, tipo: 'pendiente' });
          }
        } else {
          fallidos++;
          resultados.push({ email, ok: false, motivo: r.motivo, mensaje: r.mensaje });
        }
      } catch (err: any) {
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

  } catch (error: any) {
    console.error('Error en asignación masiva:', error);
    res.status(500).json({ error: error.message || 'Error en asignación masiva' });
  }
};


// ============================================
// OBTENER CORREOS AUTORIZADOS DE UNA ENTIDAD (Admin)
// ============================================
export const obtenerCorreosAutorizados = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver correos autorizados' });
    }

    const { entidadId } = req.params;
    const { pendientes } = req.query;

    if (!entidadId) {
      return res.status(400).json({ error: 'Entidad ID es requerido' });
    }

    // Por defecto solo pendientes; ?pendientes=false trae todos
    const soloPendientes = pendientes !== 'false';

    const correos = await entidadService.obtenerCorreosAutorizados(entidadId, soloPendientes);

    res.json({
      success: true,
      data: correos
    });

  } catch (error: any) {
    console.error('Error al obtener correos autorizados:', error);
    res.status(500).json({ error: error.message || 'Error al obtener correos' });
  }
};

// ============================================
// ELIMINAR CORREO AUTORIZADO (Admin)
// ============================================
export const eliminarCorreoAutorizado = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar correos' });
    }

    const { entidadId, correoId } = req.params;

    if (!entidadId || !correoId) {
      return res.status(400).json({ error: 'Entidad ID y correo ID son requeridos' });
    }

    const eliminado = await entidadService.eliminarCorreoAutorizado(correoId, entidadId);

    if (!eliminado) {
      return res.status(404).json({ error: 'Correo no encontrado o no pertenece a este convenio' });
    }

    res.json({
      success: true,
      message: 'Correo eliminado correctamente'
    });

  } catch (error: any) {
    console.error('Error al eliminar correo autorizado:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar correo' });
  }
};


// ============================================
// MARCAR USUARIO COMO EXENTO (Admin)
// ============================================
export const marcarUsuarioExento = async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Error al marcar usuario exento:', error);
    res.status(500).json({ error: error.message || 'Error al marcar usuario exento' });
  }
};

// ============================================
// OBTENER TODOS LOS CUPONES (Admin)
// ============================================
export const obtenerCupones = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver cupones' });
    }

    const query = `
      SELECT * FROM cupones 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error al obtener cupones:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cupones' });
  }
};

// ============================================
// GENERAR FIRMA DE PAGO DE SESIÓN (Usuario)
// ============================================
export const generarFirmaPagoSesion = async (req: AuthRequest, res: Response) => {
  try {
    const { turnoId } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // 1. Verificar que el turno existe
    const turnoQuery = await pool.query(
      `SELECT * FROM turnos WHERE id = $1`,
      [turnoId]
    );

    if (turnoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const turno = turnoQuery.rows[0];

    // 2. Obtener el cobro tipo 'sesion' más reciente (evita confundir con multas)
    const cobroQuery = await pool.query(
      `SELECT id, total, estado, referencia_wompi
       FROM cobros
       WHERE turno_id = $1 AND tipo = 'sesion'
       ORDER BY created_at DESC
       LIMIT 1`,
      [turnoId]
    );

    const cobroRow = cobroQuery.rows[0];

    // Adjuntamos los campos del cobro al objeto turno con los mismos nombres
    // que esperaba el resto del código (cobro_id, total, cobro_estado, referencia_wompi)
    turno.cobro_id = cobroRow?.id || null;
    turno.total = cobroRow?.total || null;
    turno.cobro_estado = cobroRow?.estado || null;
    turno.referencia_wompi = cobroRow?.referencia_wompi || null;

    // Verificar que el usuario sea el dueño
    if (turno.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para pagar este turno' });
    }

    // Verificar que el turno esté pendiente de pago
    if (turno.estado !== 'pendiente_pago') {
      return res.status(400).json({ error: 'Este turno no requiere pago' });
    }

    // Verificar que exista el cobro
    if (!turno.cobro_id) {
      return res.status(404).json({ error: 'No se encontró el cobro asociado al turno' });
    }

    if (turno.cobro_estado === 'pagado') {
      return res.status(400).json({ error: 'Este turno ya fue pagado' });
    }

    // Si ya tiene referencia, la reutilizamos
    let referencia = turno.referencia_wompi;
    if (!referencia) {
      referencia = wompiService.generarReferencia();
      // Actualizar la referencia en la BD
      await pool.query(
        `UPDATE cobros SET referencia_wompi = $1 WHERE id = $2`,
        [referencia, turno.cobro_id]
      );
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

  } catch (error: any) {
    console.error('Error al generar firma de pago de sesión:', error);
    res.status(500).json({ error: error.message || 'Error al generar firma' });
  }
};


// ============================================
// CONDONAR MULTA (Admin)
// ============================================
export const condonarMulta = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden condonar multas' });
    }

    const adminId = req.user.id;
    const { multaId } = req.params;

    if (!multaId) {
      return res.status(400).json({ error: 'ID de multa requerido' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verificar que la multa existe, es tipo 'multa' y está pendiente
      const multaQuery = await client.query(
        `SELECT id, usuario_id, total, estado, incluida_en_cobro_id
         FROM cobros
         WHERE id = $1 AND tipo = 'multa'`,
        [multaId]
      );

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

      // 2. Si está vinculada a un cobro de sesión, ajustar el total
      if (multa.incluida_en_cobro_id) {
        // Obtener el cobro de la sesión
        const sesionQuery = await client.query(
          `SELECT id, total, monto_multas, estado
           FROM cobros
           WHERE id = $1 AND tipo = 'sesion'`,
          [multa.incluida_en_cobro_id]
        );

        if (sesionQuery.rows.length > 0) {
          const sesion = sesionQuery.rows[0];

          if (sesion.estado === 'pendiente') {
            const nuevoTotal = Math.max(0, parseFloat(sesion.total) - montoMulta);
            const nuevoMontoMultas = Math.max(0, parseFloat(sesion.monto_multas) - montoMulta);

            await client.query(
              `UPDATE cobros
               SET total = $1, monto_multas = $2, updated_at = NOW()
               WHERE id = $3`,
              [nuevoTotal, nuevoMontoMultas, sesion.id]
            );

            console.log(`💰 Sesión ${sesion.id} ajustada: total $${sesion.total} → $${nuevoTotal}`);
          }
        }
      }

      // 3. Marcar la multa como condonada
      await client.query(
        `UPDATE cobros
         SET estado = 'condonada',
             incluida_en_cobro_id = NULL,
             creado_por = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [adminId, multaId]
      );

      // 4. Auditoría
      await client.query(
        `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          multa.usuario_id,
          'multa_condonada',
          JSON.stringify({ multa_id: multaId, monto: montoMulta, admin_id: adminId })
        ]
      );

      await client.query('COMMIT');

      console.log(`✅ Multa ${multaId} condonada por admin ${adminId}`);

      res.json({
        success: true,
        message: 'Multa condonada exitosamente',
        montoCondonado: montoMulta
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error al condonar multa:', error);
    res.status(500).json({ error: error.message || 'Error al condonar multa' });
  }
};