// backend/src/services/asignacionService.ts
import { pool } from '../database/connection';

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

export class AsignacionService {
  
  /**
   * Asigna un guía a un usuario basado en reglas de negocio inteligentes
   */
  static async asignarGuia(
    usuarioId: string,
    esPrimeraVez: boolean,
    fechaProgramada?: Date,
    tipoApoyo: string = 'apoyo',
    preferenciaUsuario?: string
  ): Promise<GuiaAsignado> {
    
    // CASO 1: Primera vez → Siempre requiere admin
    if (esPrimeraVez) {
      return {
        guiaId: null,
        requiereAdmin: true,
        razon: 'Primera vez del usuario - requiere asignación manual'
      };
    }

    // CASO 2: Usuario tiene preferencia específica (mismo guía)
    if (preferenciaUsuario === 'mismo_guia' || await this.tienePreferenciaMismoGuia(usuarioId)) {
      const guiaOriginal = await this.obtenerGuiaOriginal(usuarioId);
      if (guiaOriginal && await this.verificarDisponibilidad(guiaOriginal, fechaProgramada)) {
        // Verificar que el guía no esté sobrecargado
        const carga = await this.obtenerCargaGuia(guiaOriginal);
        if (carga.turnos_activos < 5) { // Máximo 5 turnos activos
          return {
            guiaId: guiaOriginal,
            requiereAdmin: false,
            razon: 'Mismo guía (preferencia del usuario)'
          };
        }
      }
    }

    // CASO 3: Último guía con quien tuvo turno activo
    const ultimoGuia = await this.obtenerUltimoGuiaActivo(usuarioId);
    if (ultimoGuia && await this.verificarDisponibilidad(ultimoGuia, fechaProgramada)) {
      const carga = await this.obtenerCargaGuia(ultimoGuia);
      if (carga.turnos_activos < 6) {
        return {
          guiaId: ultimoGuia,
          requiereAdmin: false,
          razon: 'Último guía con turno activo'
        };
      }
    }

    // CASO 4: Asignación inteligente por carga y especialidad
    const guiaRecomendado = await this.encontrarGuiaInteligente(tipoApoyo, fechaProgramada);
    if (guiaRecomendado) {
      return {
        guiaId: guiaRecomendado.id,
        requiereAdmin: false,
        razon: `Asignación inteligente - Score: ${guiaRecomendado.score}/100`,
        guiaNombre: guiaRecomendado.nombre
      };
    }

    // CASO 5: Sin guías disponibles → Admin
    return {
      guiaId: null,
      requiereAdmin: true,
      razon: 'No hay guías disponibles con capacidad suficiente'
    };
  }

  /**
   * Verifica si el usuario tiene preferencia activa de "mismo guía"
   */
  private static async tienePreferenciaMismoGuia(usuarioId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT preferencia FROM preferencias_usuario 
       WHERE usuario_id = $1 AND estado = 'pendiente'
       ORDER BY created_at DESC LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0]?.preferencia === 'mismo_guia';
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
   * Obtiene la carga de trabajo de un guía específico
   */
  private static async obtenerCargaGuia(guiaId: string): Promise<{ turnos_activos: number; turnos_hoy: number }> {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(*) FILTER (WHERE fecha_programada::date = CURRENT_DATE) as turnos_hoy
      FROM turnos 
      WHERE guia_id = $1
    `, [guiaId]);
    
    return {
      turnos_activos: parseInt(result.rows[0].turnos_activos) || 0,
      turnos_hoy: parseInt(result.rows[0].turnos_hoy) || 0
    };
  }

  /**
   * Encuentra el mejor guía usando un sistema de puntuación
   */
  private static async encontrarGuiaInteligente(
    tipoApoyo: string,
    fechaProgramada?: Date
  ): Promise<GuiaDisponible | null> {
    
    // Obtener todos los guías disponibles con su carga
    const guias = await this.obtenerGuiasConCarga();
    
    if (guias.length === 0) return null;

    // Calcular score para cada guía
    const guiasConScore = guias.map(guia => {
      let score = 100; // Comenzar con 100 puntos
      
      // Penalizar por carga de trabajo (-10 puntos por turno activo)
      score -= guia.turnos_activos * 10;
      
      // Penalizar por turnos hoy (-5 puntos por turno hoy)
      score -= guia.turnos_hoy * 5;
      
      // Bonus por disponibilidad
      if (guia.disponible) score += 10;
      
      // Asegurar que el score no sea negativo
      score = Math.max(0, score);
      
      return {
        ...guia,
        score
      };
    });

    // Ordenar por score (mayor a menor) y tomar el mejor
    const mejorGuia = guiasConScore
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .filter(g => g.score && g.score > 20) // Solo guías con score mínimo 20
      .slice(0, 1)[0];

    // Si el mejor guía tiene score bajo, preferir admin
    if (mejorGuia && mejorGuia.score && mejorGuia.score < 30) {
      return null;
    }

    return mejorGuia || null;
  }

  /**
   * Obtiene todos los guías con su carga actual
   */
  private static async obtenerGuiasConCarga(): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        g.id,
        g.nombre,
        g.email,
        g.disponible,
        COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(t.id) FILTER (WHERE t.fecha_programada::date = CURRENT_DATE) as turnos_hoy
      FROM usuarios g
      LEFT JOIN turnos t ON t.guia_id = g.id
      WHERE g.rol = 'guia'
      GROUP BY g.id, g.nombre, g.email, g.disponible
      HAVING COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) < 6
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      nombre: row.nombre || 'Sin nombre',
      email: row.email,
      disponible: row.disponible,
      turnos_activos: parseInt(row.turnos_activos) || 0,
      turnos_hoy: parseInt(row.turnos_hoy) || 0
    }));
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

  /**
   * Obtiene estadísticas de asignación (para admin)
   */
  static async getEstadisticasAsignacion(): Promise<any> {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'pendiente_admin') as pendientes_admin,
        AVG(turnos_activos) as promedio_carga
      FROM (
        SELECT guia_id, COUNT(*) as turnos_activos
        FROM turnos
        WHERE guia_id IS NOT NULL
        AND estado IN ('pendiente', 'aceptado', 'iniciado')
        GROUP BY guia_id
      ) as cargas
    `);
    
    return {
      pendientes_admin: parseInt(result.rows[0].pendientes_admin) || 0,
      promedio_carga: parseFloat(result.rows[0].promedio_carga) || 0
    };
  }
}