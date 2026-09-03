import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// ✅ INTERFAZ PARA REQUEST CON USUARIO
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
    nombre?: string;
  } & JwtPayload;
}

// ============================================
// AUTENTICACIÓN
// ============================================
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado' });
    return;
  }
};

// ============================================
// VERIFICAR ROL DE GUÍA
// ============================================
export const requireGuia = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

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

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

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