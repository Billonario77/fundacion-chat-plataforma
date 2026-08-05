export interface GuiaAsignado {
    guiaId: string | null;
    requiereAdmin: boolean;
    razon: string;
    guiaNombre?: string;
}
export interface GuiaDisponible {
    id: string;
    nombre: string;
    email: string;
    turnos_activos: number;
    turnos_hoy: number;
    especialidad?: string;
    score?: number;
}
export declare class AsignacionService {
    static asignarGuia(usuarioId: string, esPrimeraVez: boolean, fechaProgramada?: Date, tipoApoyo?: string, preferenciaUsuario?: string): Promise<GuiaAsignado>;
    private static tienePreferenciaMismoGuia;
    private static obtenerGuiaOriginal;
    private static obtenerUltimoGuiaActivo;
    private static obtenerCargaGuia;
    private static encontrarGuiaInteligente;
    private static obtenerGuiasConCarga;
    private static verificarDisponibilidad;
    static getEstadisticasAsignacion(): Promise<any>;
}
//# sourceMappingURL=asignacionService.d.ts.map