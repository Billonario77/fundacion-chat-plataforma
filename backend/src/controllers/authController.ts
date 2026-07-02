// backend/src/controllers/authController.ts

import { Request, Response } from 'express';
import { pool } from '../database/connection';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';


export const validateRegistro = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('nombre').optional().isString().trim(),
    body('telefono').optional().isString()
];

// Registro de usuarios (todos se registran como 'usuario' por defecto)
export const registro = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password, nombre, telefono } = req.body;

        // Verificar si el email ya existe
        const existingUser = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insertar en usuarios con rol='usuario' por defecto
        // Separar el nombre completo
        const partes = nombre.trim().split(' ');
        const primer_nombre = partes[0] || '';
        const segundo_nombre = partes[1] || null;
        const primer_apellido = partes[2] || '';
        const segundo_apellido = partes[3] || null;

        const result = await pool.query(
            `INSERT INTO usuarios (email, password_hash, nombre, telefono, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'usuario', true)
            RETURNING id, email, nombre, rol`,
            [email, passwordHash, nombre, telefono, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
        );

        const newUser = result.rows[0];

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email,
                rol: newUser.rol
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        // Registrar en auditoría
        await pool.query(
            `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles)
             VALUES ($1, $2, $3)`,
            [newUser.id, 'registro', JSON.stringify({ email, rol: 'usuario' })]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                nombre: newUser.nombre,
                rol: newUser.rol
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Validaciones para login
export const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// Login (el backend determina el rol automáticamente)
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        // Buscar en usuarios (única tabla)
        const userResult = await pool.query(
            `SELECT id, email, password_hash, nombre, rol, es_admin 
             FROM usuarios 
             WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const user = userResult.rows[0];

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, user.password_hash);
        if (!passwordValida) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // Determinar rol final (si es_admin true, prevalece sobre rol)
        const rolFinal = user.es_admin ? 'admin' : user.rol;

        // Actualizar último acceso
        await pool.query('UPDATE usuarios SET updated_at = NOW(), ultimo_acceso = NOW() WHERE id = $1', [user.id]);

        // Generar token
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: rolFinal },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        // Registrar en auditoría
        await pool.query(
            `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles)
             VALUES ($1, $2, $3)`,
            [user.id, 'login', JSON.stringify({ email, rol: rolFinal, ip: req.ip })]
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: rolFinal
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener perfil del usuario autenticado
export const perfil = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const { id } = req.user;

        const result = await pool.query(
            `SELECT id, email, nombre, telefono, rol, es_admin, activo, created_at
             FROM usuarios WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        const userData = result.rows[0];
        const rolFinal = userData.es_admin ? 'admin' : userData.rol;

        res.json({
            user: {
                ...userData,
                rol: rolFinal
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};