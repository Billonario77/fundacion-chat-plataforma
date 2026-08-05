import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';
import bcrypt from 'bcrypt';

// ============================================
// OBTENER TODOS LOS USUARIOS
// ============================================

export const getUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = "WHERE rol = 'usuario'";
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        id, nombre, email, telefono, rol, disponible, 
        datos_completados, created_at, primer_nombre, primer_apellido
      FROM usuarios
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM usuarios ${whereClause}
    `;

    const paramsWithPagination = [...params, Number(limit), offset];
    const paramsForCount = params;

    const [result, countResult] = await Promise.all([
      pool.query(query, paramsWithPagination),
      pool.query(countQuery, paramsForCount)
    ]);

    res.json({
      data: result.rows,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(Number(countResult.rows[0].total) / Number(limit)),
        totalItems: Number(countResult.rows[0].total),
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER USUARIO POR ID
// ============================================

export const getUsuarioById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM usuarios WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CREAR USUARIO (Admin)
// ============================================

export const crearUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { 
      email, 
      password, 
      nombre, 
      telefono, 
      rol = 'usuario',
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido
    } = req.body;

    // Validaciones
    if (!email || !password || !nombre) {
      res.status(400).json({ error: 'Email, password y nombre son requeridos' });
      return;
    }

    if (!['usuario', 'guia', 'admin'].includes(rol)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    // Verificar si el email ya existe
    const emailCheck = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (
        email, password_hash, nombre, telefono, rol,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, email, nombre, telefono, rol`,
      [
        email, 
        passwordHash, 
        nombre, 
        telefono || null, 
        rol,
        primer_nombre || null,
        segundo_nombre || null,
        primer_apellido || null,
        segundo_apellido || null
      ]
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        result.rows[0].id,
        'crear_usuario_admin',
        JSON.stringify({ 
          email, 
          rol, 
          creado_por: req.user?.id 
        })
      ]
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ACTUALIZAR ROL DE USUARIO
// ============================================

export const actualizarRol = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { id } = req.params;
    const { rol } = req.body;

    if (!rol || !['usuario', 'guia', 'admin'].includes(rol)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    // No permitir cambiar el propio rol
    if (id === req.user.id) {
      res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
      return;
    }

    const result = await pool.query(
      `UPDATE usuarios 
       SET rol = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, nombre, email, rol`,
      [rol, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        id,
        'cambiar_rol',
        JSON.stringify({ 
          nuevo_rol: rol, 
          admin_id: req.user?.id 
        })
      ]
    );

    res.json({
      message: 'Rol actualizado correctamente',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ACTUALIZAR USUARIO (Admin)
// ============================================

export const actualizarUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { id } = req.params;
    const { 
      nombre, 
      telefono, 
      email,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      disponible
    } = req.body;

    // Verificar que el usuario existe
    const usuarioExistente = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );

    if (usuarioExistente.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Construir query dinámica
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramIndex++}`);
      values.push(telefono);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (primer_nombre !== undefined) {
      updates.push(`primer_nombre = $${paramIndex++}`);
      values.push(primer_nombre);
    }
    if (segundo_nombre !== undefined) {
      updates.push(`segundo_nombre = $${paramIndex++}`);
      values.push(segundo_nombre);
    }
    if (primer_apellido !== undefined) {
      updates.push(`primer_apellido = $${paramIndex++}`);
      values.push(primer_apellido);
    }
    if (segundo_apellido !== undefined) {
      updates.push(`segundo_apellido = $${paramIndex++}`);
      values.push(segundo_apellido);
    }
    if (disponible !== undefined) {
      updates.push(`disponible = $${paramIndex++}`);
      values.push(disponible);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nombre, email, telefono, rol, disponible
    `;

    const result = await pool.query(query, values);

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        id,
        'actualizar_usuario_admin',
        JSON.stringify({ 
          campos_actualizados: updates,
          admin_id: req.user?.id 
        })
      ]
    );

    res.json({
      message: 'Usuario actualizado correctamente',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CAMBIAR ROL DE USUARIO (alias de actualizarRol)
// ============================================

export const cambiarRolUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  // Redirigir a la función actualizarRol
  return actualizarRol(req, res);
};

// ============================================
// ELIMINAR USUARIO
// ============================================

export const eliminarUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { id } = req.params;

    // No permitir eliminar al propio admin
    if (id === req.user.id) {
      res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
      return;
    }

    // Verificar que el usuario existe
    const usuarioExistente = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE id = $1',
      [id]
    );

    if (usuarioExistente.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Eliminar usuario (las foreign keys con ON DELETE CASCADE se encargan)
    await pool.query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        id,
        'eliminar_usuario_admin',
        JSON.stringify({ 
          usuario: usuarioExistente.rows[0],
          admin_id: req.user?.id 
        })
      ]
    );

    res.json({
      message: 'Usuario eliminado correctamente',
      usuario: usuarioExistente.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};