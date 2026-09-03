"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
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
exports.isAdmin = isAdmin;
//# sourceMappingURL=isAdmin.js.map