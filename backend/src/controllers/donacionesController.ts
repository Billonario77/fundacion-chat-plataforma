import { Request, Response } from 'express';
import { Pool } from 'pg';
import { WompiService } from '../services/wompiService';
import { AuthRequest } from '../middleware/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 20
});

const wompiService = new WompiService();

// ============================================
// GENERAR FIRMA DE INTEGRIDAD (Frontend)
// ============================================
export const generarFirmaDonacion = async (req: Request, res: Response) => {
  try {
    const { monto, nombreDonante, emailDonante, esAnonima, mensaje } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    if (monto < 5000) {
      return res.status(400).json({ error: 'El monto mínimo de donación es $5.000 COP' });
    }

    const referencia = wompiService.generarReferencia();
    const montoEnCentavos = Math.round(monto * 100);
    const firmaIntegridad = wompiService.generarFirmaIntegridad(referencia, montoEnCentavos, 'COP');

    // Guardar la donación pendiente en la BD
    const result = await pool.query(
      `INSERT INTO donaciones (
        usuario_id, nombre_donante, email_donante, monto, moneda,
        estado, referencia_wompi, mensaje, es_anonima
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        null,
        nombreDonante || null,
        emailDonante || null,
        monto,
        'COP',
        'pendiente',
        referencia,
        mensaje || null,
        esAnonima || false
      ]
    );

    const donacion = result.rows[0];

    res.json({
      success: true,
      data: {
        referencia,
        montoEnCentavos,
        firmaIntegridad,
        publicKey: wompiService.getPublicKey(),
        moneda: 'COP',
        donacionId: donacion.id
      }
    });

  } catch (error: any) {
    console.error('Error al generar firma de donación:', error);
    res.status(500).json({ error: error.message || 'Error al generar firma' });
  }
};

// ============================================
// WEBHOOK DE WOMPI (Recibe notificaciones)
// ============================================
export const webhookWompi = async (req: Request, res: Response) => {
  try {
    const { event, data, signature, timestamp } = req.body;

    console.log('📩 Webhook Wompi recibido:', event);
    console.log('📩 Timestamp:', timestamp);

    // Verificar la firma del webhook (pasando el body completo)
    const esValido = wompiService.verificarWebhook(req.body, signature);

    if (!esValido) {
      console.error('❌ Firma de webhook inválida');
      // ⚠️ Aun si falla, responder 200 para evitar reintentos infinitos
      return res.status(200).json({ received: true, verified: false });
    }

    console.log('✅ Firma de webhook válida');

    // Procesar según el evento
    if (event === 'transaction.updated') {
      const transaccion = data.transaction;
      const referencia = transaccion.reference;
      const estadoWompi = transaccion.status;

      console.log(`📌 Transacción ${referencia} - Estado: ${estadoWompi}`);

      let estadoInterno = 'pendiente';
      if (estadoWompi === 'APPROVED') estadoInterno = 'completada';
      else if (estadoWompi === 'DECLINED') estadoInterno = 'fallida';
      else if (estadoWompi === 'VOIDED') estadoInterno = 'cancelada';
      else if (estadoWompi === 'ERROR') estadoInterno = 'error';

      const result = await pool.query(
        `UPDATE donaciones 
         SET estado = $1, 
             metodo_pago = $2,
             updated_at = NOW()
         WHERE referencia_wompi = $3
         RETURNING *`,
        [
          estadoInterno,
          transaccion.payment_method_type || null,
          referencia
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Donación actualizada: ${referencia} → ${estadoInterno}`);
      } else {
        console.warn(`⚠️ Donación no encontrada: ${referencia}`);
      }
    }

    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Error en webhook Wompi:', error);
    res.status(200).json({ received: true, error: error.message });
  }
};

// ============================================
// OBTENER TODAS LAS DONACIONES (Admin)
// ============================================
export const obtenerDonaciones = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver donaciones' });
    }

    const { estado, fecha_desde, fecha_hasta } = req.query;

    let query = `SELECT * FROM donaciones WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (estado) {
      query += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (fecha_desde) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT 500`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error al obtener donaciones:', error);
    res.status(500).json({ error: error.message || 'Error al obtener donaciones' });
  }
};

// ============================================
// ESTADÍSTICAS DE DONACIONES (Admin)
// ============================================
export const obtenerEstadisticasDonaciones = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver estadísticas' });
    }

    const query = `
      SELECT 
        COUNT(*) as total_donaciones,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END), 0) as completadas,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END), 0) as pendientes,
        COALESCE(SUM(CASE WHEN estado = 'fallida' THEN 1 ELSE 0 END), 0) as fallidas,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) as total_recaudado,
        COALESCE(AVG(CASE WHEN estado = 'completada' THEN monto ELSE NULL END), 0) as promedio_donacion
      FROM donaciones
    `;
    const result = await pool.query(query);

    // Donaciones por mes (últimos 6 meses)
    const porMesQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as cantidad,
        COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) as total
      FROM donaciones
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `;
    const porMesResult = await pool.query(porMesQuery);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        por_mes: porMesResult.rows
      }
    });

  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
};

// ============================================
// OBTENER DONACIÓN POR REFERENCIA (Público)
// ============================================
export const obtenerDonacionPorReferencia = async (req: Request, res: Response) => {
  try {
    const { referencia } = req.params;

    const result = await pool.query(
      `SELECT id, referencia_wompi, monto, moneda, estado, metodo_pago, created_at 
       FROM donaciones 
       WHERE referencia_wompi = $1`,
      [referencia]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error al obtener donación:', error);
    res.status(500).json({ error: error.message || 'Error al obtener donación' });
  }
};