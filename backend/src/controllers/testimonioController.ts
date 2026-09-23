// backend/src/controllers/testimonioController.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';

/* =========================================================
   PÚBLICO
   ========================================================= */

// GET /api/testimonios  →  solo aprobados, paginados
export const getTestimoniosPublicos = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(24, Number(req.query.limit) || 9);
        const offset = (page - 1) * limit;
        const calificacion = req.query.calificacion ? Number(req.query.calificacion) : null;

        const filtros: string[] = [`t.estado = 'aprobado'`];
        const params: any[] = [];

        if (calificacion && calificacion >= 1 && calificacion <= 5) {
            params.push(calificacion);
            filtros.push(`t.calificacion = $${params.length}`);
        }

        const where = `WHERE ${filtros.join(' AND ')}`;

        const { rows } = await pool.query(
            `SELECT
                t.id, t.contenido, t.calificacion, t.destacado, t.creado_en,
                u.es_anonimo,
                CASE WHEN u.es_anonimo THEN COALESCE(u.nickname, 'Anónimo')
                     ELSE COALESCE(u.nombre, 'Usuario') END AS autor
             FROM testimonios t
             JOIN usuarios u ON u.id = t.usuario_id
             ${where}
             ORDER BY t.destacado DESC, t.creado_en DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const totalRes = await pool.query(
            `SELECT COUNT(*)::int AS total FROM testimonios t ${where}`,
            params
        );

        const total = totalRes.rows[0].total;

        res.json({
            testimonios: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error en getTestimoniosPublicos:', error);
        res.status(500).json({ error: 'Error al obtener testimonios' });
    }
};

/* =========================================================
   USUARIO AUTENTICADO
   ========================================================= */

// POST /api/testimonios
export const crearTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const usuarioId = req.user.id;
        const { contenido, calificacion } = req.body;

        const texto = (contenido ?? '').toString().trim();
        const cal = Number(calificacion);

        if (texto.length < 20) {
            res.status(400).json({ error: 'El testimonio debe tener al menos 20 caracteres' });
            return;
        }
        if (texto.length > 1000) {
            res.status(400).json({ error: 'Máximo 1000 caracteres' });
            return;
        }
        if (!cal || cal < 1 || cal > 5) {
            res.status(400).json({ error: 'Calificación entre 1 y 5' });
            return;
        }

        const pend = await pool.query(
            `SELECT 1 FROM testimonios WHERE usuario_id = $1 AND estado = 'pendiente'`,
            [usuarioId]
        );
        if (pend.rowCount) {
            res.status(409).json({ error: 'Ya tienes un testimonio en revisión' });
            return;
        }

        const { rows } = await pool.query(
            `INSERT INTO testimonios (usuario_id, contenido, calificacion, estado)
             VALUES ($1, $2, $3, 'pendiente')
             RETURNING *`,
            [usuarioId, texto, cal]
        );

        res.status(201).json({
            mensaje: '¡Gracias! Tu testimonio será revisado por el equipo.',
            testimonio: rows[0],
        });
    } catch (error: any) {
        if (error?.code === '23505') {
            res.status(409).json({ error: 'Ya tienes un testimonio en revisión' });
            return;
        }
        console.error('Error en crearTestimonio:', error);
        res.status(500).json({ error: 'Error al crear testimonio' });
    }
};

// GET /api/testimonios/mios
export const getMisTestimonios = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { rows } = await pool.query(
            `SELECT id, contenido, calificacion, estado, motivo_rechazo, destacado,
                    creado_en, actualizado_en
             FROM testimonios
             WHERE usuario_id = $1
             ORDER BY creado_en DESC`,
            [req.user.id]
        );

        res.json({ testimonios: rows });
    } catch (error) {
        console.error('Error en getMisTestimonios:', error);
        res.status(500).json({ error: 'Error al obtener tus testimonios' });
    }
};

// PUT /api/testimonios/:id  → editar (solo propios y si NO está aprobado)
export const editarTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { id } = req.params;
        const usuarioId = req.user.id;
        const { contenido, calificacion } = req.body;

        const actual = await pool.query(
            `SELECT * FROM testimonios WHERE id = $1 AND usuario_id = $2`,
            [id, usuarioId]
        );
        if (!actual.rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        if (actual.rows[0].estado === 'aprobado') {
            res.status(403).json({ error: 'No puedes editar un testimonio ya aprobado' });
            return;
        }

        const texto = (contenido ?? '').toString().trim();
        const cal = Number(calificacion);
        if (texto.length < 20 || texto.length > 1000) {
            res.status(400).json({ error: 'Contenido inválido (20-1000 caracteres)' });
            return;
        }
        if (!cal || cal < 1 || cal > 5) {
            res.status(400).json({ error: 'Calificación entre 1 y 5' });
            return;
        }

        const { rows } = await pool.query(
            `UPDATE testimonios
                SET contenido = $1,
                    calificacion = $2,
                    estado = 'pendiente',
                    motivo_rechazo = NULL,
                    moderado_por = NULL,
                    moderado_en = NULL
              WHERE id = $3 AND usuario_id = $4
              RETURNING *`,
            [texto, cal, id, usuarioId]
        );

        res.json({ mensaje: 'Testimonio actualizado y reenviado a revisión', testimonio: rows[0] });
    } catch (error) {
        console.error('Error en editarTestimonio:', error);
        res.status(500).json({ error: 'Error al editar testimonio' });
    }
};

// DELETE /api/testimonios/:id
export const eliminarMiTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { rowCount } = await pool.query(
            `DELETE FROM testimonios WHERE id = $1 AND usuario_id = $2`,
            [req.params.id, req.user.id]
        );
        if (!rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }

        res.json({ mensaje: 'Testimonio eliminado' });
    } catch (error) {
        console.error('Error en eliminarMiTestimonio:', error);
        res.status(500).json({ error: 'Error al eliminar testimonio' });
    }
};

/* =========================================================
   ADMIN
   ========================================================= */

// GET /api/testimonios/admin/todos?estado=pendiente&page=1&limit=20
export const adminListarTestimonios = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 20);
        const offset = (page - 1) * limit;
        const estado = req.query.estado as string | undefined;

        const filtros: string[] = [];
        const params: any[] = [];
        if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
            params.push(estado);
            filtros.push(`t.estado = $${params.length}`);
        }
        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT
                t.*,
                u.email, u.nombre, u.nickname, u.es_anonimo,
                m.email AS moderador_email
             FROM testimonios t
             JOIN usuarios u ON u.id = t.usuario_id
             LEFT JOIN usuarios m ON m.id = t.moderado_por
             ${where}
             ORDER BY
                CASE t.estado WHEN 'pendiente' THEN 0 WHEN 'aprobado' THEN 1 ELSE 2 END,
                t.creado_en DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const totalRes = await pool.query(
            `SELECT COUNT(*)::int AS total FROM testimonios t ${where}`,
            params
        );

        res.json({
            testimonios: rows,
            total: totalRes.rows[0].total,
            page,
            totalPages: Math.ceil(totalRes.rows[0].total / limit),
        });
    } catch (error) {
        console.error('Error en adminListarTestimonios:', error);
        res.status(500).json({ error: 'Error al listar testimonios' });
    }
};

// PATCH /api/testimonios/admin/:id/aprobar
export const adminAprobarTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { rows } = await pool.query(
            `UPDATE testimonios
                SET estado = 'aprobado',
                    motivo_rechazo = NULL,
                    moderado_por = $1,
                    moderado_en = NOW()
              WHERE id = $2
              RETURNING *`,
            [req.user.id, req.params.id]
        );
        if (!rows.length) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }

        res.json({ mensaje: 'Testimonio aprobado', testimonio: rows[0] });
    } catch (error) {
        console.error('Error en adminAprobarTestimonio:', error);
        res.status(500).json({ error: 'Error al aprobar testimonio' });
    }
};

// PATCH /api/testimonios/admin/:id/rechazar
export const adminRechazarTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { motivo } = req.body;
        if (!motivo || String(motivo).trim().length < 5) {
            res.status(400).json({ error: 'Debes indicar un motivo de rechazo' });
            return;
        }

        const { rows } = await pool.query(
            `UPDATE testimonios
                SET estado = 'rechazado',
                    motivo_rechazo = $1,
                    moderado_por = $2,
                    moderado_en = NOW()
              WHERE id = $3
              RETURNING *`,
            [String(motivo).trim(), req.user.id, req.params.id]
        );
        if (!rows.length) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }

        res.json({ mensaje: 'Testimonio rechazado', testimonio: rows[0] });
    } catch (error) {
        console.error('Error en adminRechazarTestimonio:', error);
        res.status(500).json({ error: 'Error al rechazar testimonio' });
    }
};

// PATCH /api/testimonios/admin/:id/destacar
export const adminDestacarTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { rows } = await pool.query(
            `UPDATE testimonios
                SET destacado = NOT destacado
              WHERE id = $1 AND estado = 'aprobado'
              RETURNING *`,
            [req.params.id]
        );
        if (!rows.length) {
            res.status(400).json({ error: 'Solo se pueden destacar testimonios aprobados' });
            return;
        }

        res.json({ mensaje: 'Estado de destaque actualizado', testimonio: rows[0] });
    } catch (error) {
        console.error('Error en adminDestacarTestimonio:', error);
        res.status(500).json({ error: 'Error al destacar testimonio' });
    }
};

// DELETE /api/testimonios/admin/:id
export const adminEliminarTestimonio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM testimonios WHERE id = $1`,
            [req.params.id]
        );
        if (!rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }

        res.json({ mensaje: 'Testimonio eliminado' });
    } catch (error) {
        console.error('Error en adminEliminarTestimonio:', error);
        res.status(500).json({ error: 'Error al eliminar testimonio' });
    }
};