import { Pool } from 'pg';

// ============================================
// INTERFACES
// ============================================

export type PlanSuscripcion = 'bienestar' | 'refugio' | 'santuario';

export interface SuscripcionActiva {
  id: string;
  usuario_id: string;
  plan: PlanSuscripcion;
  sesiones_incluidas: number;
  sesiones_usadas: number;
  precio_pagado: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: 'activa' | 'vencida' | 'cancelada';
  estado_pago: 'pendiente' | 'pagado' | 'fallido';
  referencia_wompi?: string;
  pagado_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SERVICIO
// ============================================

export class SuscripcionService {
  constructor(private pool: Pool) {}

  /**
   * Obtiene la suscripción activa de un usuario (si existe).
   *
   * Una suscripción se considera activa si:
   *  - estado = 'activa'
   *  - estado_pago = 'pagado'
   *  - fecha_fin > NOW()
   *
   * Si el usuario tiene varias filas (renovaciones), devuelve la más reciente.
   */
  async obtenerPlanActivo(usuarioId: string): Promise<SuscripcionActiva | null> {
    const query = `
      SELECT *
      FROM suscripciones
      WHERE usuario_id = $1
        AND estado = 'activa'
        AND estado_pago = 'pagado'
        AND fecha_fin > NOW()
      ORDER BY fecha_fin DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [usuarioId]);
    return result.rows[0] || null;
  }

  /**
   * Versión booleana rápida para usar en cálculos de costo.
   */
  async tieneSuscripcionActiva(usuarioId: string): Promise<boolean> {
    const sub = await this.obtenerPlanActivo(usuarioId);
    return sub !== null;
  }

  /**
   * Devuelve la configuración de los 3 planes desde la tabla `configuracion`.
   * Estructura: { bienestar: { sesiones, precio }, refugio: {...}, santuario: {...} }
   */
  async obtenerPlanes(): Promise<Record<PlanSuscripcion, { sesiones: number; precio: number }>> {
    const query = `
      SELECT clave, valor
      FROM configuracion
      WHERE clave IN (
        'plan_bienestar_sesiones', 'plan_bienestar_precio',
        'plan_refugio_sesiones',   'plan_refugio_precio',
        'plan_santuario_sesiones', 'plan_santuario_precio'
      )
    `;
    const result = await this.pool.query(query);
    const mapa: Record<string, string> = {};
    for (const row of result.rows) mapa[row.clave] = row.valor;

    return {
      bienestar: {
        sesiones: parseInt(mapa['plan_bienestar_sesiones'] || '4'),
        precio: parseFloat(mapa['plan_bienestar_precio'] || '300000'),
      },
      refugio: {
        sesiones: parseInt(mapa['plan_refugio_sesiones'] || '9'),
        precio: parseFloat(mapa['plan_refugio_precio'] || '600000'),
      },
      santuario: {
        sesiones: parseInt(mapa['plan_santuario_sesiones'] || '20'),
        precio: parseFloat(mapa['plan_santuario_precio'] || '1000000'),
      },
    };
  }

  /**
   * Crea una suscripción en estado 'pendiente'. Aún no cuenta como activa.
   * Genera una referencia Wompi con prefijo 'SUS-' para que el webhook la reconozca.
   */
  async crearPendiente(
    usuarioId: string,
    plan: PlanSuscripcion,
    montoMultasPendientes: number = 0
  ): Promise<SuscripcionActiva> {
    const planes = await this.obtenerPlanes();
    const config = planes[plan];
    if (!config) throw new Error(`Plan inválido: ${plan}`);

    // Precio del plan + multas acumuladas del usuario (Opción B)
    const precioTotal = config.precio + montoMultasPendientes;

    // Referencia Wompi única
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const referencia = `SUS-${plan.toUpperCase()}-${timestamp}-${random}`;

    // fecha_fin tentativa: 30 días desde hoy (se recalcula al confirmar pago)
    const query = `
      INSERT INTO suscripciones (
        usuario_id, plan, sesiones_incluidas, sesiones_usadas,
        precio_pagado, fecha_inicio, fecha_fin,
        estado, estado_pago, referencia_wompi
      )
      VALUES ($1, $2, $3, 0, $4, NOW(), NOW() + INTERVAL '30 days',
              'activa', 'pendiente', $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      usuarioId,
      plan,
      config.sesiones,
      precioTotal,
      referencia,
    ]);
    return result.rows[0];
  }

  /**
   * Obtiene una suscripción por referencia Wompi.
   * Útil para el webhook.
   */
  async obtenerPorReferencia(referencia: string): Promise<SuscripcionActiva | null> {
    const result = await this.pool.query(
      `SELECT * FROM suscripciones WHERE referencia_wompi = $1 LIMIT 1`,
      [referencia]
    );
    return result.rows[0] || null;
  }

  /**
   * Devuelve el histórico de suscripciones de un usuario (más reciente primero).
   */
  async obtenerHistorial(usuarioId: string): Promise<SuscripcionActiva[]> {
    const result = await this.pool.query(
      `SELECT * FROM suscripciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  /**
   * Suma las multas pendientes del usuario. Se usan para la Opción B
   * (se acumulan al siguiente pago de plan).
   */
  async obtenerMultasPendientesMonto(usuarioId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM cobros
       WHERE usuario_id = $1
         AND tipo = 'multa'
         AND estado = 'pendiente'`,
      [usuarioId]
    );
    return parseFloat(result.rows[0]?.total || '0');
  }

    /**
   * Confirma el pago de una suscripción pendiente.
   * Llamado desde el webhook de Wompi cuando llega una transacción aprobada.
   *
   * Reglas:
   *  - Cambia estado_pago a 'pagado' y guarda pagado_at.
   *  - Reinicia fecha_inicio = NOW() y fecha_fin = NOW() + 30 days
   *    (los 30 días cuentan desde que se paga, no desde que se crea).
   *  - Reinicia sesiones_usadas = 0.
   *  - Marca como pagadas TODAS las multas pendientes del usuario
   *    (Opción B: se acumularon al precio del plan).
   *
   * Idempotente: si ya está pagada, devuelve la fila sin tocar nada.
   */
  async confirmarPago(referencia: string): Promise<SuscripcionActiva> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const subQuery = await client.query(
        `SELECT * FROM suscripciones WHERE referencia_wompi = $1 FOR UPDATE`,
        [referencia]
      );
      const sub = subQuery.rows[0];

      if (!sub) {
        throw new Error(`Suscripción con referencia ${referencia} no encontrada`);
      }

      if (sub.estado_pago === 'pagado') {
        await client.query('COMMIT');
        return sub;
      }

      // 1. Confirmar la suscripción y reiniciar fechas + contador
      const updateQuery = `
        UPDATE suscripciones
        SET estado_pago = 'pagado',
            pagado_at = NOW(),
            fecha_inicio = NOW(),
            fecha_fin = NOW() + INTERVAL '30 days',
            sesiones_usadas = 0,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [sub.id]);
      const subActualizada = updateResult.rows[0];

      // 2. Marcar TODAS las multas pendientes del usuario como pagadas
      //    (Opción B: fueron cobradas en el precio del plan)
      await client.query(
        `UPDATE cobros
         SET estado = 'pagado',
             pagado_at = NOW(),
             metodo_pago = 'wompi_suscripcion',
             updated_at = NOW()
         WHERE usuario_id = $1
           AND tipo = 'multa'
           AND estado = 'pendiente'`,
        [sub.usuario_id]
      );

      await client.query('COMMIT');
      return subActualizada;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Consume una sesión del plan activo.
   * Se llama al crear un turno que el suscriptor NO va a pagar
   * (porque está cubierto por su plan).
   *
   * Devuelve true si consumió una sesión disponible, false si ya no había cupo.
   */
  async consumirSesion(usuarioId: string): Promise<{ ok: boolean; sesionesRestantes: number }> {
    const sub = await this.obtenerPlanActivo(usuarioId);

    if (!sub) {
      return { ok: false, sesionesRestantes: 0 };
    }

    if (sub.sesiones_usadas >= sub.sesiones_incluidas) {
      return { ok: false, sesionesRestantes: 0 };
    }

    const updateResult = await this.pool.query(
      `UPDATE suscripciones
       SET sesiones_usadas = sesiones_usadas + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING sesiones_incluidas, sesiones_usadas`,
      [sub.id]
    );

    const row = updateResult.rows[0];
    const restantes = row.sesiones_incluidas - row.sesiones_usadas;

    return { ok: true, sesionesRestantes: restantes };
  }

    /**
   * Marca como 'vencida' todas las suscripciones cuya fecha_fin ya pasó.
   * Idempotente: solo toca las que están en estado 'activa' con estado_pago 'pagado'.
   * Devuelve el número de filas afectadas.
   */
  async marcarVencidas(): Promise<number> {
    const result = await this.pool.query(
      `UPDATE suscripciones
       SET estado = 'vencida',
           updated_at = NOW()
       WHERE estado = 'activa'
         AND estado_pago = 'pagado'
         AND fecha_fin <= NOW()`
    );
    return result.rowCount || 0;
  }

  /**
   * Devuelve las suscripciones que vencen en los próximos N días.
   * Usado por el worker para enviar recordatorios de renovación.
   */
  async obtenerProximasAVencer(dias: number = 3): Promise<SuscripcionActiva[]> {
    const result = await this.pool.query(
      `SELECT * FROM suscripciones
       WHERE estado = 'activa'
         AND estado_pago = 'pagado'
         AND fecha_fin > NOW()
         AND fecha_fin <= NOW() + ($1 || ' days')::interval
       ORDER BY fecha_fin ASC`,
      [dias]
    );
    return result.rows;
  }

}