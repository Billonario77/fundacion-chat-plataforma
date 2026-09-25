"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEliminarTestimonio = exports.adminDestacarTestimonio = exports.adminRechazarTestimonio = exports.adminAprobarTestimonio = exports.adminListarTestimonios = exports.eliminarMiTestimonio = exports.editarTestimonio = exports.getMisTestimonios = exports.crearTestimonio = exports.getTestimoniosPublicos = void 0;
const connection_1 = require("../database/connection");
const getTestimoniosPublicos = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(24, Number(req.query.limit) || 9);
        const offset = (page - 1) * limit;
        const calificacion = req.query.calificacion ? Number(req.query.calificacion) : null;
        const filtros = [`t.estado = 'aprobado'`];
        const params = [];
        if (calificacion && calificacion >= 1 && calificacion <= 5) {
            params.push(calificacion);
            filtros.push(`t.calificacion = $${params.length}`);
        }
        const where = `WHERE ${filtros.join(' AND ')}`;
        const { rows } = await connection_1.pool.query(`SELECT
                t.id, t.titulo, t.contenido, t.calificacion, t.edad, t.ciudad,
                t.destacado, t.creado_en,
                u.es_anonimo,
                CASE WHEN u.es_anonimo THEN COALESCE(u.nickname, 'Anónimo')
                     ELSE COALESCE(u.nombre, 'Usuario') END AS autor
             FROM testimonios t
             JOIN usuarios u ON u.id = t.usuario_id
             ${where}
             ORDER BY t.creado_en DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
        const totalRes = await connection_1.pool.query(`SELECT COUNT(*)::int AS total FROM testimonios t ${where}`, params);
        const total = totalRes.rows[0].total;
        res.json({
            testimonios: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        console.error('Error en getTestimoniosPublicos:', error);
        res.status(500).json({ error: 'Error al obtener testimonios' });
    }
};
exports.getTestimoniosPublicos = getTestimoniosPublicos;
const crearTestimonio = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const usuarioId = req.user.id;
        const { titulo, contenido, calificacion, edad, ciudad } = req.body;
        const tituloTexto = (titulo ?? '').toString().trim();
        const texto = (contenido ?? '').toString().trim();
        const cal = Number(calificacion);
        const edadNum = edad === null || edad === undefined || edad === '' ? null : Number(edad);
        const ciudadTexto = (ciudad ?? '').toString().trim() || null;
        if (tituloTexto.length < 5) {
            res.status(400).json({ error: 'El título debe tener al menos 5 caracteres' });
            return;
        }
        if (tituloTexto.length > 150) {
            res.status(400).json({ error: 'El título no puede superar 150 caracteres' });
            return;
        }
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
        if (edadNum !== null && (isNaN(edadNum) || edadNum < 13 || edadNum > 120)) {
            res.status(400).json({ error: 'La edad debe estar entre 13 y 120' });
            return;
        }
        if (ciudadTexto && ciudadTexto.length > 100) {
            res.status(400).json({ error: 'La ciudad no puede superar 100 caracteres' });
            return;
        }
        const pend = await connection_1.pool.query(`SELECT 1 FROM testimonios WHERE usuario_id = $1 AND estado = 'pendiente'`, [usuarioId]);
        if (pend.rowCount) {
            res.status(409).json({ error: 'Ya tienes un testimonio en revisión' });
            return;
        }
        const { rows } = await connection_1.pool.query(`INSERT INTO testimonios (usuario_id, titulo, contenido, calificacion, edad, ciudad, estado)
             VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
             RETURNING *`, [usuarioId, tituloTexto, texto, cal, edadNum, ciudadTexto]);
        res.status(201).json({
            mensaje: '¡Gracias! Tu testimonio será revisado por el equipo.',
            testimonio: rows[0],
        });
    }
    catch (error) {
        if (error?.code === '23505') {
            res.status(409).json({ error: 'Ya tienes un testimonio en revisión' });
            return;
        }
        console.error('Error en crearTestimonio:', error);
        res.status(500).json({ error: 'Error al crear testimonio' });
    }
};
exports.crearTestimonio = crearTestimonio;
const getMisTestimonios = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { rows } = await connection_1.pool.query(`SELECT id, titulo, contenido, calificacion, edad, ciudad, estado,
                    motivo_rechazo, destacado, creado_en, actualizado_en
             FROM testimonios
             WHERE usuario_id = $1
             ORDER BY creado_en DESC`, [req.user.id]);
        res.json({ testimonios: rows });
    }
    catch (error) {
        console.error('Error en getMisTestimonios:', error);
        res.status(500).json({ error: 'Error al obtener tus testimonios' });
    }
};
exports.getMisTestimonios = getMisTestimonios;
const editarTestimonio = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { id } = req.params;
        const usuarioId = req.user.id;
        const { titulo, contenido, calificacion, edad, ciudad } = req.body;
        const actual = await connection_1.pool.query(`SELECT * FROM testimonios WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
        if (!actual.rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        if (actual.rows[0].estado === 'aprobado') {
            res.status(403).json({ error: 'No puedes editar un testimonio ya aprobado' });
            return;
        }
        const tituloTexto = (titulo ?? '').toString().trim();
        const texto = (contenido ?? '').toString().trim();
        const cal = Number(calificacion);
        const edadNum = edad === null || edad === undefined || edad === '' ? null : Number(edad);
        const ciudadTexto = (ciudad ?? '').toString().trim() || null;
        if (tituloTexto.length < 5 || tituloTexto.length > 150) {
            res.status(400).json({ error: 'Título inválido (5-150 caracteres)' });
            return;
        }
        if (texto.length < 20 || texto.length > 1000) {
            res.status(400).json({ error: 'Contenido inválido (20-1000 caracteres)' });
            return;
        }
        if (!cal || cal < 1 || cal > 5) {
            res.status(400).json({ error: 'Calificación entre 1 y 5' });
            return;
        }
        if (edadNum !== null && (isNaN(edadNum) || edadNum < 13 || edadNum > 120)) {
            res.status(400).json({ error: 'La edad debe estar entre 13 y 120' });
            return;
        }
        if (ciudadTexto && ciudadTexto.length > 100) {
            res.status(400).json({ error: 'La ciudad no puede superar 100 caracteres' });
            return;
        }
        const { rows } = await connection_1.pool.query(`UPDATE testimonios
                SET titulo = $1,
                    contenido = $2,
                    calificacion = $3,
                    edad = $4,
                    ciudad = $5,
                    estado = 'pendiente',
                    motivo_rechazo = NULL,
                    moderado_por = NULL,
                    moderado_en = NULL
              WHERE id = $6 AND usuario_id = $7
              RETURNING *`, [tituloTexto, texto, cal, edadNum, ciudadTexto, id, usuarioId]);
        res.json({ mensaje: 'Testimonio actualizado y reenviado a revisión', testimonio: rows[0] });
    }
    catch (error) {
        console.error('Error en editarTestimonio:', error);
        res.status(500).json({ error: 'Error al editar testimonio' });
    }
};
exports.editarTestimonio = editarTestimonio;
const eliminarMiTestimonio = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { rowCount } = await connection_1.pool.query(`DELETE FROM testimonios WHERE id = $1 AND usuario_id = $2`, [req.params.id, req.user.id]);
        if (!rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        res.json({ mensaje: 'Testimonio eliminado' });
    }
    catch (error) {
        console.error('Error en eliminarMiTestimonio:', error);
        res.status(500).json({ error: 'Error al eliminar testimonio' });
    }
};
exports.eliminarMiTestimonio = eliminarMiTestimonio;
const adminListarTestimonios = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 20);
        const offset = (page - 1) * limit;
        const estado = req.query.estado;
        const filtros = [];
        const params = [];
        if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
            params.push(estado);
            filtros.push(`t.estado = $${params.length}`);
        }
        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const { rows } = await connection_1.pool.query(`SELECT
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
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
        const totalRes = await connection_1.pool.query(`SELECT COUNT(*)::int AS total FROM testimonios t ${where}`, params);
        res.json({
            testimonios: rows,
            total: totalRes.rows[0].total,
            page,
            totalPages: Math.ceil(totalRes.rows[0].total / limit),
        });
    }
    catch (error) {
        console.error('Error en adminListarTestimonios:', error);
        res.status(500).json({ error: 'Error al listar testimonios' });
    }
};
exports.adminListarTestimonios = adminListarTestimonios;
const adminAprobarTestimonio = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { rows } = await connection_1.pool.query(`UPDATE testimonios
                SET estado = 'aprobado',
                    motivo_rechazo = NULL,
                    moderado_por = $1,
                    moderado_en = NOW()
              WHERE id = $2
              RETURNING *`, [req.user.id, req.params.id]);
        if (!rows.length) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        res.json({ mensaje: 'Testimonio aprobado', testimonio: rows[0] });
    }
    catch (error) {
        console.error('Error en adminAprobarTestimonio:', error);
        res.status(500).json({ error: 'Error al aprobar testimonio' });
    }
};
exports.adminAprobarTestimonio = adminAprobarTestimonio;
const adminRechazarTestimonio = async (req, res) => {
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
        const { rows } = await connection_1.pool.query(`UPDATE testimonios
                SET estado = 'rechazado',
                    motivo_rechazo = $1,
                    moderado_por = $2,
                    moderado_en = NOW()
              WHERE id = $3
              RETURNING *`, [String(motivo).trim(), req.user.id, req.params.id]);
        if (!rows.length) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        res.json({ mensaje: 'Testimonio rechazado', testimonio: rows[0] });
    }
    catch (error) {
        console.error('Error en adminRechazarTestimonio:', error);
        res.status(500).json({ error: 'Error al rechazar testimonio' });
    }
};
exports.adminRechazarTestimonio = adminRechazarTestimonio;
const adminDestacarTestimonio = async (req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`UPDATE testimonios
                SET destacado = NOT destacado
              WHERE id = $1 AND estado = 'aprobado'
              RETURNING *`, [req.params.id]);
        if (!rows.length) {
            res.status(400).json({ error: 'Solo se pueden destacar testimonios aprobados' });
            return;
        }
        res.json({ mensaje: 'Estado de destaque actualizado', testimonio: rows[0] });
    }
    catch (error) {
        console.error('Error en adminDestacarTestimonio:', error);
        res.status(500).json({ error: 'Error al destacar testimonio' });
    }
};
exports.adminDestacarTestimonio = adminDestacarTestimonio;
const adminEliminarTestimonio = async (req, res) => {
    try {
        const { rowCount } = await connection_1.pool.query(`DELETE FROM testimonios WHERE id = $1`, [req.params.id]);
        if (!rowCount) {
            res.status(404).json({ error: 'Testimonio no encontrado' });
            return;
        }
        res.json({ mensaje: 'Testimonio eliminado' });
    }
    catch (error) {
        console.error('Error en adminEliminarTestimonio:', error);
        res.status(500).json({ error: 'Error al eliminar testimonio' });
    }
};
exports.adminEliminarTestimonio = adminEliminarTestimonio;
//# sourceMappingURL=testimonioController.js.map