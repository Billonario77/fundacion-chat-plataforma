"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireGuia = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token no proporcionado' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requireGuia = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
    }
    if (user.rol !== 'guia') {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de guía.' });
        return;
    }
    next();
};
exports.requireGuia = requireGuia;
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
    }
    if (user.rol !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map