import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';
import { notificarUsuario, notificarAAdmins } from '../services/socketService';

// ============================================
// OBTENER GUÍAS DISPONIBLES
// ============================================

export const getGuiasDisponibles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(
      `SELECT id, nombre, email FROM usuarios 
       WHERE rol = 'guia' AND disponible = true
       ORDER BY nombre ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER TURNOS PENDIENTES DE ASIGNACIÓN
// ============================================

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
        t.created_at,
        t.estado,
        t.requiere_asignacion_admin,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.primer_nombre,
        u.primer_apellido
      FROM turnos t
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE t.estado = 'pendiente_admin'
        AND t.requiere_asignacion_admin = true
        AND t.guia_id IS NULL
      ORDER BY t.created_at ASC
    `;

    const result = await pool.query(query);

    // Enriquecer con información adicional
    const turnos = await Promise.all(result.rows.map(async (turno) => {
      // Obtener mensaje inicial de la conversación
      const mensajeQuery = await pool.query(
        `SELECT contenido FROM mensajes 
         WHERE turno_id = $1 
         ORDER BY created_at ASC 
         LIMIT 1`,
        [turno.id]
      );

      return {
        id: turno.id,
        usuario_id: turno.usuario_id,
        usuario_nombre: turno.usuario_nombre || `${turno.primer_nombre || ''} ${turno.primer_apellido || ''}`.trim() || 'Usuario',
        usuario_email: turno.usuario_email,
        created_at: turno.created_at,
        mensaje_inicial: mensajeQuery.rows[0]?.contenido || null,
        tipo: 'apoyo' // Por defecto, se podría mejorar
      };
    }));

    res.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ASIGNAR GUÍA A TURNO
// ============================================

export const asignarGuiaATurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { turnoId } = req.params;
    const { guiaId } = req.body;

    if (!turnoId || !guiaId) {
      res.status(400).json({ error: 'Faltan datos: turnoId y guiaId son requeridos' });
      return;
    }

    // Verificar que el guía existe y está disponible
    const guiaQuery = await pool.query(
      `SELECT id, nombre FROM usuarios 
       WHERE id = $1 AND rol = 'guia' AND disponible = true`,
      [guiaId]
    );

    if (guiaQuery.rows.length === 0) {
      res.status(404).json({ error: 'Guía no encontrado o no disponible' });
      return;
    }

    // Verificar que el turno existe y está pendiente
    const turnoQuery = await pool.query(
      `SELECT id, usuario_id, estado FROM turnos 
       WHERE id = $1 AND estado = 'pendiente_admin'`,
      [turnoId]
    );

    if (turnoQuery.rows.length === 0) {
      res.status(404).json({ error: 'Turno no encontrado o no está pendiente de asignación' });
      return;
    }

    const turno = turnoQuery.rows[0];

    // Asignar guía
    await pool.query(
      `UPDATE turnos 
       SET guia_id = $1, estado = 'pendiente', requiere_asignacion_admin = false
       WHERE id = $2`,
      [guiaId, turnoId]
    );

    // Notificar al usuario
    notificarUsuario(turno.usuario_id, 'estado-turno-actualizado', {
      turnoId: turnoId,
      estado: 'pendiente',
      mensaje: `Un guía ha sido asignado a tu turno: ${guiaQuery.rows[0].nombre}`
    });

    // Notificar al guía
    notificarUsuario(guiaId, 'nuevo-turno-disponible', {
      turnoId: turnoId,
      usuarioId: turno.usuario_id,
      mensaje: 'Tienes un nuevo turno asignado'
    });

    res.json({
      message: 'Guía asignado exitosamente',
      turnoId: turnoId,
      guia: guiaQuery.rows[0]
    });

  } catch (error) {
    console.error('Error al asignar guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CREAR TURNO REPROGRAMADO (desde reprogramación)
// ============================================

export const crearTurnoReprogramado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { solicitudId } = req.params;
    const { guiaId, fecha, comentarios } = req.body;

    if (!solicitudId || !guiaId || !fecha) {
      res.status(400).json({ error: 'Faltan datos: solicitudId, guiaId y fecha son requeridos' });
      return;
    }

    // Obtener la solicitud de reprogramación
    const solicitudQuery = await pool.query(
      `SELECT * FROM reprogramaciones WHERE id = $1 AND estado = 'pendiente'`,
      [solicitudId]
    );

    if (solicitudQuery.rows.length === 0) {
      res.status(404).json({ error: 'Solicitud de reprogramación no encontrada o ya procesada' });
      return;
    }

    const solicitud = solicitudQuery.rows[0];

    // Obtener el turno original
    const turnoOriginalQuery = await pool.query(
      `SELECT * FROM turnos WHERE id = $1`,
      [solicitud.turno_original_id]
    );

    if (turnoOriginalQuery.rows.length === 0) {
      res.status(404).json({ error: 'Turno original no encontrado' });
      return;
    }

    const turnoOriginal = turnoOriginalQuery.rows[0];

    // Verificar que el guía existe
    const guiaQuery = await pool.query(
      `SELECT id, nombre FROM usuarios WHERE id = $1 AND rol = 'guia'`,
      [guiaId]
    );

    if (guiaQuery.rows.length === 0) {
      res.status(404).json({ error: 'Guía no encontrado' });
      return;
    }

    // Crear nuevo turno
    const nuevoTurnoQuery = `
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
      ) VALUES ($1, $2, $3, $4, $5, 'pendiente', true, $6, NOW())
      RETURNING id
    `;

    const nuevoTurnoResult = await pool.query(nuevoTurnoQuery, [
      turnoOriginal.usuario_id,
      guiaId,
      new Date(fecha),
      turnoOriginal.duracion_minutos || 60,
      turnoOriginal.modalidad || 'chat',
      turnoOriginal.id
    ]);

    const nuevoTurnoId = nuevoTurnoResult.rows[0].id;

    // Actualizar la solicitud de reprogramación
    await pool.query(
      `UPDATE reprogramaciones 
       SET estado = 'completada', 
           nuevo_turno_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nuevoTurnoId, solicitudId]
    );

    // Notificar al usuario
    notificarUsuario(turnoOriginal.usuario_id, 'estado-turno-actualizado', {
      turnoId: nuevoTurnoId,
      estado: 'pendiente',
      mensaje: `Tu turno ha sido reprogramado con el guía ${guiaQuery.rows[0].nombre} para el ${new Date(fecha).toLocaleString()}`
    });

    // Notificar al guía
    notificarUsuario(guiaId, 'nuevo-turno-disponible', {
      turnoId: nuevoTurnoId,
      usuarioId: turnoOriginal.usuario_id,
      mensaje: 'Tienes un nuevo turno reprogramado'
    });

    // Notificar a admins que se completó
    notificarAAdmins('reprogramacion-completada', {
      solicitudId: solicitudId,
      nuevoTurnoId: nuevoTurnoId,
      mensaje: 'Reprogramación completada'
    });

    res.json({
      message: 'Turno reprogramado exitosamente',
      nuevoTurnoId: nuevoTurnoId
    });

  } catch (error) {
    console.error('Error al crear turno reprogramado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER GUÍAS CON SUS USUARIOS ASIGNADOS
// ============================================

export const getGuiasConUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT 
        g.id as guiaId,
        g.nombre as guiaNombre,
        g.email as guiaEmail,
        json_agg(
          json_build_object(
            'usuarioId', u.id,
            'usuarioNombre', u.nombre,
            'usuarioEmail', u.email,
            'ultimoTurno', t.fecha_programada,
            'totalTurnos', t.total
          )
        ) as usuarios
      FROM usuarios g
      LEFT JOIN (
        SELECT 
          guia_id,
          usuario_id,
          MAX(fecha_programada) as fecha_programada,
          COUNT(*) as total
        FROM turnos
        GROUP BY guia_id, usuario_id
      ) t ON t.guia_id = g.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE g.rol = 'guia'
      GROUP BY g.id, g.nombre, g.email
      ORDER BY g.nombre ASC
    `;

    const result = await pool.query(query);
    
    // Filtrar usuarios nulos y dar formato
    const guias = result.rows.map((row: any) => ({
      ...row,
      usuarios: row.usuarios.filter((u: any) => u.usuarioId !== null)
    }));

    res.json(guias);
  } catch (error) {
    console.error('Error al obtener guías con usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER TODOS LOS USUARIOS CON SU GUÍA
// ============================================

export const getUsuariosConGuia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT DISTINCT ON (u.id)
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        g.id as guia_id,
        g.nombre as guia_nombre,
        g.email as guia_email,
        t.fecha_programada as ultimo_turno
      FROM usuarios u
      LEFT JOIN turnos t ON t.usuario_id = u.id
      LEFT JOIN usuarios g ON t.guia_id = g.id AND g.rol = 'guia'
      WHERE u.rol = 'usuario'
      ORDER BY u.id, t.fecha_programada DESC NULLS LAST
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios con guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CONTAR REPROGRAMACIONES PENDIENTES
// ============================================

export const countReprogramacionesPendientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM reprogramaciones WHERE estado = 'pendiente'`
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error al contar reprogramaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER REPROGRAMACIONES PENDIENTES
// ============================================

export const getReprogramacionesPendientes = async (req: AuthRequest, res: Response): Promise<void> => {
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
        r.preferencia,
        r.fecha_preferida,
        r.comentarios,
        r.created_at,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        t.fecha_programada as turno_original_fecha,
        t.estado as turno_original_estado,
        g.nombre as guia_original_nombre
      FROM reprogramaciones r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN turnos t ON r.turno_original_id = t.id
      LEFT JOIN usuarios g ON t.guia_id = g.id AND g.rol = 'guia'
      WHERE r.estado = 'pendiente'
      ORDER BY r.created_at ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reprogramaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER CARGA DE TRABAJO DE GUÍAS (NUEVO)
// ============================================

export const getCargaGuias = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar que sea admin
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const query = `
      SELECT 
        g.id,
        g.nombre,
        g.email,
        g.disponible,
        COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(t.id) FILTER (WHERE t.estado = 'pendiente') as turnos_pendientes,
        COUNT(t.id) FILTER (WHERE t.estado = 'aceptado') as turnos_aceptados,
        COUNT(t.id) FILTER (WHERE t.estado = 'iniciado') as turnos_en_curso,
        COUNT(t.id) as turnos_totales,
        (SELECT COUNT(*) FROM turnos t2 
         WHERE t2.guia_id = g.id 
         AND t2.estado IN ('pendiente', 'aceptado', 'iniciado')
         AND t2.fecha_programada > NOW()
         AND t2.fecha_programada < NOW() + INTERVAL '24 hours') as turnos_proximas_24h
      FROM usuarios g
      LEFT JOIN turnos t ON t.guia_id = g.id
      WHERE g.rol = 'guia'
      GROUP BY g.id, g.nombre, g.email, g.disponible
      ORDER BY turnos_activos DESC, g.nombre ASC
    `;

    const result = await pool.query(query);

    res.json({
      total_guias: result.rows.length,
      guias: result.rows.map((row: any) => ({
        id: row.id,
        nombre: row.nombre || 'Sin nombre',
        email: row.email,
        disponible: row.disponible,
        turnos_activos: parseInt(row.turnos_activos) || 0,
        turnos_pendientes: parseInt(row.turnos_pendientes) || 0,
        turnos_aceptados: parseInt(row.turnos_aceptados) || 0,
        turnos_en_curso: parseInt(row.turnos_en_curso) || 0,
        turnos_totales: parseInt(row.turnos_totales) || 0,
        turnos_proximas_24h: parseInt(row.turnos_proximas_24h) || 0
      }))
    });

  } catch (error) {
    console.error('Error al obtener carga de guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER CARGA DE UN GUÍA ESPECÍFICO
// ============================================

export const getMiCarga = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar que sea guía
    if (req.user?.rol !== 'guia') {
      res.status(403).json({ error: 'Acceso solo para guías' });
      return;
    }

    const guiaId = req.user.id;

    const query = `
      SELECT 
        COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(t.id) FILTER (WHERE t.estado = 'pendiente') as turnos_pendientes,
        COUNT(t.id) FILTER (WHERE t.estado = 'aceptado') as turnos_aceptados,
        COUNT(t.id) FILTER (WHERE t.estado = 'iniciado') as turnos_en_curso,
        COUNT(t.id) as turnos_totales,
        (SELECT COUNT(*) FROM turnos t2 
         WHERE t2.guia_id = $1 
         AND t2.estado IN ('pendiente', 'aceptado', 'iniciado')
         AND t2.fecha_programada > NOW()
         AND t2.fecha_programada < NOW() + INTERVAL '24 hours') as turnos_proximas_24h
      FROM turnos t
      WHERE t.guia_id = $1
    `;

    const result = await pool.query(query, [guiaId]);

    res.json({
      turnos_activos: parseInt(result.rows[0].turnos_activos) || 0,
      turnos_pendientes: parseInt(result.rows[0].turnos_pendientes) || 0,
      turnos_aceptados: parseInt(result.rows[0].turnos_aceptados) || 0,
      turnos_en_curso: parseInt(result.rows[0].turnos_en_curso) || 0,
      turnos_totales: parseInt(result.rows[0].turnos_totales) || 0,
      turnos_proximas_24h: parseInt(result.rows[0].turnos_proximas_24h) || 0
    });

  } catch (error) {
    console.error('Error al obtener carga del guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
