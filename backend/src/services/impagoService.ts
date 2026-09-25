// backend/src/services/impagoService.ts

import { pool } from '../database/connection';
import { notificarUsuario } from './socketService';

interface TurnoImpago {
  id: string;
  usuario_id: string;
  guia_id: string | null;
  fecha_programada: Date;
  es_urgente: boolean;
  usuario_nombre: string | null;
}

export class ImpagoService {
  /**
   * Busca y cancela turnos en pendiente_pago que ya vencieron su ventana de pago.
   * - No urgentes: se cancelan cuando falta 1h o menos para el inicio.
   * - Urgentes: se cancelan 5 min después de la hora de inicio.
   */
  static async procesarTurnosImpagos(): Promise<{
    procesados: number;
    errores: number;
  }> {
    const inicio = new Date();
    console.log(`\n🕐 [ImpagoService] Iniciando revisión - ${inicio.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

    let procesados = 0;
    let errores = 0;

    try {
      // ============================================
      // 1. BUSCAR TURNOS IMPAGOS
      // ============================================
      const query = `
        SELECT 
          t.id,
          t.usuario_id,
          t.guia_id,
          t.fecha_programada,
          t.es_urgente,
          u.nombre as usuario_nombre
        FROM turnos t
        JOIN usuarios u ON u.id = t.usuario_id
        WHERE t.estado = 'pendiente_pago'
          AND (
            (t.es_urgente = false AND t.fecha_programada - INTERVAL '1 hour' <= NOW())
            OR
            (t.es_urgente = true AND t.fecha_programada + INTERVAL '5 minutes' <= NOW())
          )
      `;

      const result = await pool.query<TurnoImpago>(query);
      const turnos = result.rows;

      console.log(`📋 Turnos impagos encontrados: ${turnos.length}`);

      if (turnos.length === 0) {
        console.log('✅ No hay turnos por cancelar\n');
        return { procesados: 0, errores: 0 };
      }

      // ============================================
      // 2. PROCESAR CADA TURNO
      // ============================================
      for (const turno of turnos) {
        try {
          await this.cancelarTurnoImpago(turno);
          procesados++;
        } catch (err) {
          errores++;
          console.error(`❌ Error procesando turno ${turno.id}:`, err);
        }
      }

      console.log(`✅ [ImpagoService] Procesados: ${procesados}, Errores: ${errores}\n`);
      return { procesados, errores };

    } catch (error) {
      console.error('❌ [ImpagoService] Error general:', error);
      return { procesados, errores: errores + 1 };
    }
  }

  /**
   * Cancela un turno específico por impago y aplica la multa.
   */
  private static async cancelarTurnoImpago(turno: TurnoImpago): Promise<void> {
    console.log(`\n🔄 Cancelando turno ${turno.id} por impago (urgente: ${turno.es_urgente})`);

    // ============================================
    // 1. CANCELAR EL TURNO
    // ============================================
    const cancelResult = await pool.query(
      `UPDATE turnos
       SET estado = 'cancelado',
           motivo_cancelacion = 'Cancelado automáticamente por falta de pago',
           cancelado_por = 'sistema',
           cancelado_automaticamente = true
       WHERE id = $1
         AND estado = 'pendiente_pago'
       RETURNING id`,
      [turno.id]
    );

    if (cancelResult.rowCount === 0) {
      console.log(`⚠️ Turno ${turno.id} ya fue procesado por otro lado. Saltando.`);
      return;
    }

    // ============================================
    // 2. OBTENER CONFIGURACIÓN Y CALCULAR MULTA
    // ============================================
    const configPrecio = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'precio_sesion'`
    );
    const precioSesion = parseFloat(configPrecio.rows[0]?.valor || '100000');

    const configMulta = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'multa_cancelacion_porcentaje'`
    );
    const porcentajeMulta = parseFloat(configMulta.rows[0]?.valor || '50');

    const montoMulta = Math.round(precioSesion * (porcentajeMulta / 100) * 100) / 100;

    // ============================================
    // 3. CREAR COBRO DE MULTA
    // ============================================
    const insertMulta = await pool.query(
      `INSERT INTO cobros (
        turno_id, usuario_id, guia_id, duracion_minutos,
        costo_por_hora, descuento_porcentaje, descuento_aplicado,
        total, estado, tipo, concepto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, total`,
      [
        turno.id,
        turno.usuario_id,
        turno.guia_id,
        0,
        0,
        0,
        0,
        montoMulta,
        'pendiente',
        'multa',
        `Multa por impago de sesión agendada (${porcentajeMulta}% de $${precioSesion})`
      ]
    );

    console.log(`💰 Multa creada: $${montoMulta} (cobro ${insertMulta.rows[0].id})`);

    // ============================================
    // 4. NOTIFICAR AL USUARIO
    // ============================================
    try {
      notificarUsuario(turno.usuario_id, 'estado-turno-actualizado', {
        turnoId: turno.id,
        estado: 'cancelado',
        mensaje: `Tu sesión fue cancelada por falta de pago. Se generó una multa del ${porcentajeMulta}% ($${montoMulta.toLocaleString('es-CO')}) que se sumará a tu próxima sesión.`
      });
    } catch (err) {
      console.error('⚠️ Error notificando al usuario:', err);
    }

    // ============================================
    // 5. NOTIFICAR AL GUÍA
    // ============================================
    if (turno.guia_id) {
      try {
        const fechaFormateada = new Date(turno.fecha_programada).toLocaleString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Bogota'
        });

        notificarUsuario(turno.guia_id, 'estado-turno-actualizado', {
          turnoId: turno.id,
          estado: 'cancelado',
          mensaje: `Tu sesión del ${fechaFormateada} con ${turno.usuario_nombre || 'el usuario'} se liberó por falta de pago.`
        });
      } catch (err) {
        console.error('⚠️ Error notificando al guía:', err);
      }
    }

    // ============================================
    // 6. AUDITORÍA
    // ============================================
    await pool.query(
      `INSERT INTO auditoria_logs (usuario_afectado_id, accion, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        turno.usuario_id,
        'turno_cancelado_por_impago',
        JSON.stringify({
          turno_id: turno.id,
          es_urgente: turno.es_urgente,
          monto_multa: montoMulta,
          porcentaje_multa: porcentajeMulta
        })
      ]
    );

    console.log(`✅ Turno ${turno.id} cancelado y multa aplicada`);
  }
}