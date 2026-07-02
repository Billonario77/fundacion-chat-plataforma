import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';
import { notificarUsuario } from '../services/socketService';
import { notificarAAdmins } from '../services/socketService';

// Obtener solicitudes de reprogramación pendientes
export const getSolicitudesPendientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT 
        r.id,
        r.turno_original_id,
        r.usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        r.preferencia,
        r.fecha_preferida,
        r.comentarios,
        r.estado,
        r.created_at,
        r.updated_at
      FROM reprogramaciones r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.estado = 'pendiente'
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener guías disponibles (desde tabla usuarios con rol='guia')
export const getGuiasDisponibles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('👤 Usuario que solicita guías:', req.user?.email);
    
    if (req.user?.rol !== 'admin') {
      console.log('⛔ Acceso denegado - no es admin');
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT 
        id,
        nombre,
        email
      FROM usuarios
      WHERE rol = 'guia' AND disponible = true
      ORDER BY nombre
    `;

    const result = await pool.query(query);
    console.log('📋 Guías disponibles:', result.rows);
    res.json(result.rows);

  } catch (error) {
    console.error('❌ Error al obtener guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear turno reprogramado
export const crearTurnoReprogramado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🚀 INICIANDO crearTurnoReprogramado');
    console.log('👤 Admin:', req.user?.email);
    
    if (req.user?.rol !== 'admin') {
      console.log('⛔ Acceso denegado - no es admin');
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { solicitudId } = req.params;
    const { guiaId, fechaProgramada } = req.body;

    console.log('📦 Parámetros recibidos:', { solicitudId, guiaId, fechaProgramada });

    if (!solicitudId || !guiaId) {
      res.status(400).json({ error: 'solicitudId y guiaId son requeridos' });
      return;
    }

    // Obtener la solicitud de reprogramación
    const solicitudQuery = `
      SELECT r.*, t.*, t.id as turno_original_id
      FROM reprogramaciones r
      JOIN turnos t ON r.turno_original_id = t.id
      WHERE r.id = $1 AND r.estado = 'pendiente'
    `;
    
    const solicitudResult = await pool.query(solicitudQuery, [solicitudId]);
    
    if (solicitudResult.rows.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
      return;
    }

    const solicitud = solicitudResult.rows[0];

    // Verificar que el guía existe y está disponible (desde usuarios)
    const guiaQuery = await pool.query(
      'SELECT id, nombre, disponible FROM usuarios WHERE id = $1 AND rol = $2',
      [guiaId, 'guia']
    );
    
    if (guiaQuery.rows.length === 0) {
      res.status(404).json({ error: 'Guía no encontrado' });
      return;
    }

    if (!guiaQuery.rows[0].disponible) {
      res.status(400).json({ error: 'El guía no está disponible actualmente' });
      return;
    }

    // Determinar fecha para el nuevo turno
    let fechaTurno: Date;
    if (fechaProgramada) {
      fechaTurno = new Date(fechaProgramada);
    } else if (solicitud.fecha_preferida) {
      fechaTurno = new Date(solicitud.fecha_preferida);
    } else {
      fechaTurno = new Date();
      fechaTurno.setHours(fechaTurno.getHours() + 1);
    }

    // Verificar disponibilidad del guía
    const duracion = solicitud.duracion_minutos || 60;
    
    const verificarDisponibilidad = await pool.query(
      `SELECT id FROM turnos 
       WHERE guia_id = $1 
       AND estado IN ('pendiente', 'aceptado', 'iniciado')
       AND fecha_programada < $2::timestamp + ($3::int * interval '1 minute')
       AND fecha_programada + (COALESCE(duracion_minutos, 60) * interval '1 minute') > $2::timestamp`,
      [guiaId, fechaTurno, duracion]
    );
    
    if (verificarDisponibilidad.rows.length > 0) {
      res.status(400).json({ error: 'El guía ya tiene un turno programado en ese horario' });
      return;
    }

    // Crear el nuevo turno
    const insertTurnoQuery = `
      INSERT INTO turnos (
        usuario_id,
        guia_id,
        fecha_programada,
        duracion_minutos,
        modalidad,
        estado,
        es_reprogramacion,
        turno_original_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const turnoValues = [
      solicitud.usuario_id,
      guiaId,
      fechaTurno,
      duracion,
      solicitud.modalidad || 'chat',
      'pendiente',
      true,
      solicitud.turno_original_id
    ];
    
    const turnoResult = await pool.query(insertTurnoQuery, turnoValues);
    const nuevoTurnoId = turnoResult.rows[0].id;

    // Guardar preferencia del usuario
    if (solicitud.preferencia) {
      const preferenciaQuery = await pool.query(
        `SELECT id FROM preferencias_usuario 
         WHERE usuario_id = $1 AND estado = 'pendiente'`,
        [solicitud.usuario_id]
      );

      if (preferenciaQuery.rows.length > 0) {
        await pool.query(
          `UPDATE preferencias_usuario 
           SET preferencia = $1, updated_at = NOW()
           WHERE usuario_id = $2 AND estado = 'pendiente'`,
          [solicitud.preferencia, solicitud.usuario_id]
        );
      } else {
        await pool.query(
          `INSERT INTO preferencias_usuario (usuario_id, preferencia, estado)
           VALUES ($1, $2, 'pendiente')`,
          [solicitud.usuario_id, solicitud.preferencia]
        );
      }
    }

    // Notificaciones
    notificarUsuario(solicitud.usuario_id, 'estado-turno-actualizado', {
      turnoId: nuevoTurnoId,
      estado: 'pendiente',
      mensaje: 'Tu solicitud de reprogramación fue aceptada. Ya tienes un nuevo turno asignado.'
    });

    notificarUsuario(guiaId, 'nuevo-turno-disponible', {
      turnoId: nuevoTurnoId,
      usuarioId: solicitud.usuario_id,
      mensaje: 'Se te ha asignado un nuevo turno (reprogramación)'
    });

    // Actualizar la solicitud de reprogramación
    await pool.query(
      `UPDATE reprogramaciones 
       SET estado = 'completada', nuevo_turno_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [nuevoTurnoId, solicitudId]
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, guia_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [solicitud.usuario_id, guiaId, 'reprogramar_turno', JSON.stringify({ 
        solicitud_id: solicitudId,
        turno_original: solicitud.turno_original_id,
        nuevo_turno: nuevoTurnoId,
        admin: req.user?.email
      })]
    );

    res.json({
      message: 'Turno reprogramado exitosamente',
      nuevo_turno_id: nuevoTurnoId
    });

  } catch (error) {
    console.error('❌ Error en crearTurnoReprogramado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Asignar guía a solicitud
export const asignarGuia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { solicitudId } = req.params;
    const { guiaId } = req.body;

    const solicitudQuery = 'SELECT id FROM reprogramaciones WHERE id = $1 AND estado = $2';
    const solicitudResult = await pool.query(solicitudQuery, [solicitudId, 'pendiente']);
    
    if (solicitudResult.rows.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }

    res.json({ 
      message: 'Guía asignado correctamente',
      solicitud_id: solicitudId,
      guia_id: guiaId
    });

  } catch (error) {
    console.error('Error al asignar guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener turnos pendientes de asignación
export const getTurnosPendientesAsignacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT 
        t.id,
        t.usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        t.modalidad as tipo,
        t.created_at,
        '' as mensaje_inicial,
        t.estado
      FROM turnos t
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE t.requiere_asignacion_admin = true 
        AND t.estado = 'pendiente_admin'
        AND t.guia_id IS NULL
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener turnos pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Asignar guía a un turno pendiente
export const asignarGuiaATurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { turnoId } = req.params;
    const { guiaId } = req.body;

    if (!turnoId || !guiaId) {
      res.status(400).json({ error: 'turnoId y guiaId son requeridos' });
      return;
    }

    const turnoQuery = await pool.query(
      'SELECT id, usuario_id FROM turnos WHERE id = $1 AND requiere_asignacion_admin = true AND estado = $2',
      [turnoId, 'pendiente_admin']
    );

    if (turnoQuery.rows.length === 0) {
      res.status(404).json({ error: 'Turno no encontrado o ya no requiere asignación' });
      return;
    }

    const guiaQuery = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE id = $1 AND rol = $2',
      [guiaId, 'guia']
    );

    if (guiaQuery.rows.length === 0) {
      res.status(404).json({ error: 'Guía no encontrado' });
      return;
    }

    await pool.query(
      `UPDATE turnos 
       SET guia_id = $1, 
           estado = 'pendiente', 
           requiere_asignacion_admin = false
       WHERE id = $2`,
      [guiaId, turnoId]
    );

    notificarUsuario(turnoQuery.rows[0].usuario_id, 'estado-turno-actualizado', {
      turnoId: turnoId,
      estado: 'pendiente',
      mensaje: 'Ya tienes un guía asignado. Pronto podrás comenzar tu sesión.'
    });

    notificarUsuario(guiaId, 'nuevo-turno-disponible', {
      turnoId: turnoId,
      usuarioId: turnoQuery.rows[0].usuario_id,
      mensaje: 'Se te ha asignado un nuevo turno'
    });

    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, guia_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [turnoQuery.rows[0].usuario_id, guiaId, 'asignacion_manual_admin', JSON.stringify({ 
        turno_id: turnoId,
        admin: req.user?.email
      })]
    );

    res.json({ message: 'Guía asignado correctamente', turnoId, guiaId });

  } catch (error) {
    console.error('Error al asignar guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


// Obtener todos los guías con sus usuarios asignados
export const getGuiasConUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    // Primero obtener todos los guías
    const guiasQuery = `
      SELECT id, nombre, email 
      FROM usuarios 
      WHERE rol = 'guia' 
      ORDER BY nombre ASC
    `;
    
    const guiasResult = await pool.query(guiasQuery);
    const guias = guiasResult.rows;

    // Para cada guía, obtener sus usuarios
    const resultado = [];
    
    for (const guia of guias) {
      const usuariosQuery = `
        SELECT DISTINCT
          u.id as usuario_id,
          u.nombre as usuario_nombre,
          u.email as usuario_email,
          MAX(t.fecha_programada) as ultimo_turno,
          COUNT(t.id) as total_turnos
        FROM usuarios u
        INNER JOIN turnos t ON u.id = t.usuario_id
        WHERE t.guia_id = $1
        GROUP BY u.id, u.nombre, u.email
        ORDER BY u.nombre ASC
      `;
      
      const usuariosResult = await pool.query(usuariosQuery, [guia.id]);
      
      resultado.push({
        guiaId: guia.id,
        guiaNombre: guia.nombre,
        guiaEmail: guia.email,
        usuarios: usuariosResult.rows
      });
    }

    res.json(resultado);

  } catch (error) {
    console.error('❌ Error al obtener guías con usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error instanceof Error ? error.message : 'Error desconocido' });
  }
};


// Buscar usuario por nombre o email y obtener su guía
export const buscarUsuarioConGuia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { termino } = req.query;

    if (!termino) {
      res.status(400).json({ error: 'Término de búsqueda requerido' });
      return;
    }

    const query = `
      SELECT DISTINCT
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        g.id as guia_id,
        g.nombre as guia_nombre,
        g.email as guia_email,
        (
          SELECT fecha_programada 
          FROM turnos 
          WHERE usuario_id = u.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as ultimo_turno
      FROM usuarios u
      LEFT JOIN turnos t ON u.id = t.usuario_id
      LEFT JOIN usuarios g ON t.guia_id = g.id AND g.rol = 'guia'
      WHERE u.nombre ILIKE $1 OR u.email ILIKE $1
      ORDER BY u.nombre
    `;

    const result = await pool.query(query, [`%${termino}%`]);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al buscar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener lista de todos los guías (para filtros)
export const getTodosGuias = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(`
      SELECT id, nombre, email 
      FROM usuarios 
      WHERE rol = 'guia'
      ORDER BY nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener lista de todos los usuarios (para filtros)
export const getTodosUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(`
      SELECT id, nombre, email 
      FROM usuarios 
      WHERE rol = 'usuario'
      ORDER BY nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los usuarios con su guía asignado
export const getTodosUsuariosConGuia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(`
      SELECT 
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        g.id as guia_id,
        g.nombre as guia_nombre,
        g.email as guia_email,
        (
          SELECT MAX(fecha_programada) 
          FROM turnos 
          WHERE usuario_id = u.id 
            AND estado = 'completado'
        ) as ultimo_turno
      FROM usuarios u
      LEFT JOIN (
        SELECT DISTINCT ON (usuario_id) usuario_id, guia_id
        FROM turnos
        WHERE estado IN ('completado', 'iniciado', 'aceptado')
        ORDER BY usuario_id, fecha_programada DESC
      ) ultimo ON u.id = ultimo.usuario_id
      LEFT JOIN usuarios g ON ultimo.guia_id = g.id AND g.rol = 'guia'
      WHERE u.rol = 'usuario'
      ORDER BY u.nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios con guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Contar reprogramaciones pendientes
export const contarReprogramacionesPendientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reprogramaciones
      WHERE estado = 'pendiente'
    `);

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error al contar reprogramaciones pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};