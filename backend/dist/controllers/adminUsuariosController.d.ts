import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getUsuarios: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsuarioById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const crearUsuario: (req: AuthRequest, res: Response) => Promise<void>;
export declare const actualizarRol: (req: AuthRequest, res: Response) => Promise<void>;
export declare const actualizarUsuario: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cambiarRolUsuario: (req: AuthRequest, res: Response) => Promise<void>;
export declare const eliminarUsuario: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminUsuariosController.d.ts.map