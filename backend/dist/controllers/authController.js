"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfil = exports.login = exports.validateLogin = exports.registro = exports.validateRegistro = void 0;
const connection_1 = require("../database/connection");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
exports.validateRegistro = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    (0, express_validator_1.body)('nombre').optional().isString().trim(),
    (0, express_validator_1.body)('telefono').optional().isString(),
    (0, express_validator_1.body)('es_anonimo').optional().isBoolean(),
    (0, express_validator_1.body)('nickname').optional().isString().trim()
];
const registro = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password, nombre, telefono, es_anonimo, nickname } = req.body;
        const existingUser = await connection_1.pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        if (es_anonimo) {
            if (!nickname || nickname.trim() === '') {
                res.status(400).json({ error: 'Debes ingresar un NickName si eliges el modo anónimo' });
                return;
            }
            const result = await connection_1.pool.query(`INSERT INTO usuarios (
                    email, password_hash, nombre, telefono,
                    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                    rol, activo, es_anonimo, nickname
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'usuario', true, true, $9)
                RETURNING id, email, nombre, rol, es_anonimo, nickname`, [
                email,
                passwordHash,
                nickname.trim(),
                telefono || null,
                nickname.trim(),
                null,
                '',
                null,
                nickname.trim()
            ]);
            const newUser = result.rows[0];
            const token = jsonwebtoken_1.default.sign({
                id: newUser.id,
                email: newUser.email,
                rol: newUser.rol
            }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
            await connection_1.pool.query(`INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles)
                 VALUES ($1, $2, $3)`, [newUser.id, 'registro_anonimo', JSON.stringify({ email, nickname })]);
            console.log(`✅ Usuario anónimo registrado: ${nickname} (${email})`);
            res.status(201).json({
                message: 'Usuario anónimo registrado exitosamente',
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    nombre: newUser.nickname,
                    nickname: newUser.nickname,
                    rol: newUser.rol,
                    es_anonimo: true
                }
            });
            return;
        }
        if (!nombre || nombre.trim() === '') {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }
        const partes = nombre.trim().split(' ');
        const primer_nombre = partes[0] || '';
        const segundo_nombre = partes[1] || null;
        const primer_apellido = partes[2] || '';
        const segundo_apellido = partes[3] || null;
        const result = await connection_1.pool.query(`INSERT INTO usuarios (
                email, password_hash, nombre, telefono,
                primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                rol, activo, es_anonimo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'usuario', true, false)
            RETURNING id, email, nombre, rol, es_anonimo, nickname`, [email, passwordHash, nombre, telefono, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]);
        const newUser = result.rows[0];
        const token = jsonwebtoken_1.default.sign({
            id: newUser.id,
            email: newUser.email,
            rol: newUser.rol
        }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        await connection_1.pool.query(`INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles)
             VALUES ($1, $2, $3)`, [newUser.id, 'registro', JSON.stringify({ email, rol: 'usuario' })]);
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                nombre: newUser.nombre,
                rol: newUser.rol,
                es_anonimo: false
            }
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.registro = registro;
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
];
const login = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        const userResult = await connection_1.pool.query(`SELECT id, email, password_hash, nombre, rol, es_admin, es_anonimo, nickname 
             FROM usuarios 
             WHERE email = $1`, [email]);
        if (userResult.rows.length === 0) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const user = userResult.rows[0];
        const passwordValida = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordValida) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const rolFinal = user.es_admin ? 'admin' : user.rol;
        await connection_1.pool.query('UPDATE usuarios SET updated_at = NOW(), ultimo_acceso = NOW() WHERE id = $1', [user.id]);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, rol: rolFinal }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        await connection_1.pool.query(`INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles)
             VALUES ($1, $2, $3)`, [user.id, 'login', JSON.stringify({ email, rol: rolFinal, ip: req.ip })]);
        const nombreMostrar = user.es_anonimo && user.nickname
            ? user.nickname
            : user.nombre;
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: nombreMostrar,
                nickname: user.nickname || null,
                rol: rolFinal,
                es_anonimo: user.es_anonimo || false
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.login = login;
const perfil = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { id } = req.user;
        const result = await connection_1.pool.query(`SELECT id, email, nombre, telefono, rol, es_admin, activo, created_at, es_anonimo, nickname
             FROM usuarios WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const userData = result.rows[0];
        const rolFinal = userData.es_admin ? 'admin' : userData.rol;
        const nombreMostrar = userData.es_anonimo && userData.nickname
            ? userData.nickname
            : userData.nombre;
        res.json({
            user: {
                ...userData,
                nombre: nombreMostrar,
                rol: rolFinal
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.perfil = perfil;
//# sourceMappingURL=authController.js.map