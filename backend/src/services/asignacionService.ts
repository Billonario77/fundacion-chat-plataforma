// backend/src/services/asignacionService.ts
import { pool } from '../database/connection';

export interface GuiaAsignado {
  guiaId: string | null;
  requiereAdmin: boolean;
  razon: string;
}

export class AsignacionService {
  
  /**
   * Asigna un guía a un usuario basado en reglas de negocio
   */
  static async asignarGuia(
    usuarioId: string,
    esPrimeraVez: boolean,
    fechaProgramada?: Date
  ): Promise<GuiaAsignado> {
    
    // CASO 1: Primera vez → Siempre requiere admin
    if (esPrimeraVez) {
      return {
        guiaId: null,
        requiereAdmin: true,
        razon: 'Primera vez del usuario'
      };
    }

    // CASO 2: Usuario con preferencia guardada
    const preferencia = await this.obtenerPreferenciaUsuario(usuarioId);
    if (preferencia === 'mismo_guia') {
      const guiaOriginal = await this.obtenerGuiaOriginal(usuarioId);
      if (guiaOriginal && await this.verificarDisponibilidad(guiaOriginal, fechaProgramada)) {
        return {
          guiaId: guiaOriginal,
          requiereAdmin: false,
          razon: 'Mismo guía (preferencia)'
        };
      }
    }

    // CASO 3: Último guía con quien tuvo turno activo
    const ultimoGuia = await this.obtenerUltimoGuiaActivo(usuarioId);
    if (ultimoGuia && await this.verificarDisponibilidad(ultimoGuia, fechaProgramada)) {
      return {
        guiaId: ultimoGuia,
        requiereAdmin: false,
        razon: 'Último guía activo'
      };
    }

    // CASO 4: Asignación automática por carga de trabajo
    const guiaDisponible = await this.encontrarGuiaPorCarga(fechaProgramada);
    if (guiaDisponible) {
      return {
        guiaId: guiaDisponible,
        requiereAdmin: false,
        razon: 'Asignación por carga de trabajo'
      };
    }

    // CASO 5: Sin guías disponibles → Admin
    return {
      guiaId: null,
      requiereAdmin: true,
      razon: 'No hay guías disponibles'
    };
  }

  /**
   * Obtiene la preferencia activa del usuario
   */
  private static async obtenerPreferenciaUsuario(usuarioId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT preferencia FROM preferencias_usuario 
       WHERE usuario_id = $1 AND estado = 'pendiente'
       ORDER BY created_at DESC LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0]?.preferencia || null;
  }

  /**
   * Obtiene el guía original (primer guía asignado)
   */
  private static async obtenerGuiaOriginal(usuarioId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT guia_id FROM turnos 
       WHERE usuario_id = $1 AND guia_id IS NOT NULL
       ORDER BY created_at ASC LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0]?.guia_id || null;
  }

  /**
   * Obtiene el último guía con turno activo
   */
  private static async obtenerUltimoGuiaActivo(usuarioId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT guia_id FROM turnos 
       WHERE usuario_id = $1 
       AND guia_id IS NOT NULL
       AND estado IN ('pendiente', 'aceptado', 'iniciado')
       ORDER BY created_at DESC LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0]?.guia_id || null;
  }

  /**
   * Encuentra el guía con MENOS carga de trabajo
   */
  private static async encontrarGuiaPorCarga(fechaProgramada?: Date): Promise<string | null> {
    // Contar turnos activos por guía
    const result = await pool.query(`
      SELECT 
        g.id,
        COUNT(t.id) as turnos_activos
      FROM usuarios g
      LEFT JOIN turnos t ON t.guia_id = g.id 
        AND t.estado IN ('pendiente', 'aceptado', 'iniciado')
      WHERE g.rol = 'guia' 
        AND g.disponible = true
      GROUP BY g.id
      ORDER BY turnos_activos ASC, RANDOM()
      LIMIT 1
    `);
    
    return result.rows[0]?.id || null;
  }

  /**
   * Verifica disponibilidad de horario del guía
   */
  private static async verificarDisponibilidad(
    guiaId: string, 
    fechaProgramada?: Date
  ): Promise<boolean> {
    if (!fechaProgramada) return true;

    const duracion = 60;
    const fechaInicio = new Date(fechaProgramada);
    const fechaFin = new Date(fechaProgramada);
    fechaFin.setMinutes(fechaFin.getMinutes() + duracion);

    const result = await pool.query(
      `SELECT id FROM turnos 
       WHERE guia_id = $1 
       AND estado IN ('pendiente', 'aceptado', 'iniciado')
       AND (
         (fecha_programada < $2 AND (fecha_programada + (COALESCE(duracion_minutos, 60) * interval '1 minute')) > $3)
         OR
         (fecha_programada >= $3 AND fecha_programada < $2)
       )`,
      [guiaId, fechaFin, fechaInicio]
    );

    return result.rows.length === 0;
  }
}