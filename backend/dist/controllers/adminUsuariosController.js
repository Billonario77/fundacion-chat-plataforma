"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarPerfil = exports.getUsuarioById = exports.actualizarRol = exports.toggleGuiaDisponibilidad = exports.toggleUsuarioEstado = exports.getGuias = exports.getUsuarios = void 0;
const connection_1 = require("../database/connection");
const getUsuarios = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const query = `
      SELECT 
        id, 
        email, 
        nombre,
        rol,
        activo,
        created_at
      FROM usuarios
      ORDER BY created_at DESC
    `;
        const result = await connection_1.pool.query(query);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getUsuarios = getUsuarios;
const getGuias = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const query = `
      SELECT 
        id, 
        email, 
        nombre,
        disponible,
        created_at
      FROM usuarios
      WHERE rol = 'guia'
      ORDER BY created_at DESC
    `;
        const result = await connection_1.pool.query(query);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener guías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getGuias = getGuias;
const toggleUsuarioEstado = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { id } = req.params;
        const query = `
      UPDATE usuarios 
      SET activo = NOT activo, updated_at = NOW()
      WHERE id = $1 AND rol != 'admin'
      RETURNING id, email, nombre, activo, rol
    `;
        const result = await connection_1.pool.query(query, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.toggleUsuarioEstado = toggleUsuarioEstado;
const toggleGuiaDisponibilidad = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { id } = req.params;
        const query = `
      UPDATE usuarios 
      SET disponible = NOT disponible, updated_at = NOW()
      WHERE id = $1 AND rol = 'guia'
      RETURNING id, email, nombre, disponible
    `;
        const result = await connection_1.pool.query(query, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Guía no encontrado' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error al cambiar disponibilidad del guía:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.toggleGuiaDisponibilidad = toggleGuiaDisponibilidad;
const actualizarRol = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { usuarioId, rol } = req.body;
        if (!usuarioId || !rol) {
            res.status(400).json({ error: 'usuarioId y rol son requeridos' });
            return;
        }
        const rolesValidos = ['usuario', 'guia', 'admin'];
        if (!rolesValidos.includes(rol)) {
            res.status(400).json({ error: 'Rol no válido' });
            return;
        }
        if (rol !== 'admin') {
            const adminCount = await connection_1.pool.query('SELECT COUNT(*) FROM usuarios WHERE rol = $1', ['admin']);
            const usuarioActual = await connection_1.pool.query('SELECT rol FROM usuarios WHERE id = $1', [usuarioId]);
            if (usuarioActual.rows[0]?.rol === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
                res.status(400).json({ error: 'No se puede cambiar el rol del último administrador' });
                return;
            }
        }
        const query = `
      UPDATE usuarios 
      SET rol = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, nombre, rol, activo
    `;
        const result = await connection_1.pool.query(query, [rol, usuarioId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        console.log(`✅ Usuario ${usuarioId} actualizado a rol: ${rol}`);
        res.json({
            message: 'Rol actualizado correctamente',
            usuario: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.actualizarRol = actualizarRol;
const getUsuarioById = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { id } = req.params;
        const query = `
      SELECT 
        id, email, nombre, telefono, celular, cedula, edad, rh, sexo,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        altura, peso, direccion, ciudad, tipo_adiccion, observaciones,
        cto_emerg_nombre, cto_emerg_celular, cto_emerg_email, foto_perfil, cto_foto_perfil,
        rol, activo, disponible, datos_completados, created_at
      FROM usuarios 
      WHERE id = $1
    `;
        const result = await connection_1.pool.query(query, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getUsuarioById = getUsuarioById;
const actualizarPerfil = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { id } = req.params;
        const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, telefono, celular, cedula, edad, rh, sexo, estatura, peso, direccion, ciudad, tipo_adiccion, observaciones, cto_emerg_nombre, cto_emerg_celular, cto_emerg_email, foto_perfil, cto_foto_perfil, rol, activo, disponible } = req.body;
        const nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .join(' ');
        const query = `
      UPDATE usuarios 
      SET 
        primer_nombre = $1, segundo_nombre = $2, primer_apellido = $3, segundo_apellido = $4,
        nombre = $5, email = $6, telefono = $7, celular = $8, cedula = $9,
        edad = $10, rh = $11, sexo = $12, altura = $13, peso = $14,
        direccion = $15, ciudad = $16, tipo_adiccion = $17, observaciones = $18,
        cto_emerg_nombre = $19, cto_emerg_celular = $20, cto_emerg_email = $21,
        foto_perfil = $22, cto_foto_perfil = $23, rol = $24, activo = $25,
        disponible = $26, datos_completados = true, updated_at = NOW()
      WHERE id = $27
      RETURNING id, email, nombre, rol, activo
    `;
        const result = await connection_1.pool.query(query, [
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            nombreCompleto, email, telefono, celular, cedula,
            edad, rh, sexo, estatura, peso,
            direccion, ciudad, tipo_adiccion, observaciones,
            cto_emerg_nombre, cto_emerg_celular, cto_emerg_email,
            foto_perfil, cto_foto_perfil, rol, activo, disponible, id
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        console.log(`✅ Usuario ${id} actualizado por admin ${req.user.id}`);
        res.json({
            message: 'Perfil actualizado correctamente',
            usuario: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.actualizarPerfil = actualizarPerfil;
//# sourceMappingURL=adminUsuariosController.js.map