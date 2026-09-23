"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigValue = exports.actualizarConfiguracion = exports.obtenerConfiguracionPorClave = exports.obtenerConfiguracion = void 0;
const connection_1 = require("../database/connection");
const obtenerConfiguracion = async (req, res) => {
    try {
        const result = await connection_1.pool.query(`SELECT clave, valor, descripcion FROM configuracion ORDER BY clave`);
        const config = {};
        result.rows.forEach(row => {
            config[row.clave] = row.valor;
        });
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.obtenerConfiguracion = obtenerConfiguracion;
const obtenerConfiguracionPorClave = async (req, res) => {
    try {
        const { clave } = req.params;
        const result = await connection_1.pool.query(`SELECT clave, valor, descripcion FROM configuracion WHERE clave = $1`, [clave]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Configuración no encontrada' });
            return;
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.obtenerConfiguracionPorClave = obtenerConfiguracionPorClave;
const actualizarConfiguracion = async (req, res) => {
    try {
        if (req.user?.rol !== 'admin') {
            res.status(403).json({ error: 'Acceso solo para administradores' });
            return;
        }
        const { clave, valor } = req.body;
        if (!clave || valor === undefined) {
            res.status(400).json({ error: 'Clave y valor son requeridos' });
            return;
        }
        const existe = await connection_1.pool.query(`SELECT clave FROM configuracion WHERE clave = $1`, [clave]);
        if (existe.rows.length === 0) {
            res.status(404).json({ error: 'Configuración no encontrada' });
            return;
        }
        await connection_1.pool.query(`UPDATE configuracion 
       SET valor = $1, updated_at = NOW()
       WHERE clave = $2`, [String(valor), clave]);
        console.log(`⚙️ Configuración actualizada: ${clave} = ${valor} por ${req.user.email}`);
        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.actualizarConfiguracion = actualizarConfiguracion;
const getConfigValue = async (clave, defaultValue = '') => {
    try {
        const result = await connection_1.pool.query(`SELECT valor FROM configuracion WHERE clave = $1`, [clave]);
        return result.rows[0]?.valor || defaultValue;
    }
    catch (error) {
        console.error(`Error al obtener configuración ${clave}:`, error);
        return defaultValue;
    }
};
exports.getConfigValue = getConfigValue;
//# sourceMappingURL=configuracionController.js.map