import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getGuiasDisponibles: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTurnosPendientesAsignacion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const asignarGuiaATurno: (req: AuthRequest, res: Response) => Promise<void>;
export declare const crearTurnoReprogramado: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getGuiasConUsuarios: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsuariosConGuia: (req: AuthRequest, res: Response) => Promise<void>;
export declare const countReprogramacionesPendientes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getReprogramacionesPendientes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCargaGuias: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMiCarga: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map