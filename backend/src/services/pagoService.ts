import { Pool } from 'pg';

// ============================================
// INTERFACES
// ============================================

interface ResultadoCosto {
  total: number;
  descuentoPorcentaje: number;
  descuentoAplicado: number;
  esExento: boolean;
  entidadId?: string;
  usaBolsa: boolean;
  cobroId?: string;
}

interface CobroRecord {
  id: string;
  turno_id: string;
  usuario_id: string;
  guia_id: string;
  entidad_id?: string;
  duracion_minutos: number;
  costo_por_hora: number;
  descuento_porcentaje: number;
  descuento_aplicado: number;
  total: number;
  estado: string;
  metodo_pago?: string;
  comprobante_url?: string;
  preferencia_id?: string;
  pagado_at?: Date;
  creado_por?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SERVICIO
// ============================================

export class PagoService {
  constructor(private pool: Pool) {}

  /**
   * Calcular el costo de una sesión
   */
  async calcularCosto(params: {
    usuarioId: string;
    guiaId: string;
    turnoId: string;
    duracionMinutos: number;
    costoPorHora?: number;
    codigoCupon?: string;
  }): Promise<ResultadoCosto> {
    const { 
      usuarioId, 
      guiaId, 
      turnoId, 
      duracionMinutos, 
      costoPorHora = 100000, 
      codigoCupon 
    } = params;

    // 1. Obtener usuario
    const usuarioQuery = await this.pool.query(
      `SELECT id, entidad_id, es_exento, descuento_personalizado 
       FROM usuarios WHERE id = $1`,
      [usuarioId]
    );
    const usuario = usuarioQuery.rows[0];

    console.log('📌 Usuario:', usuario);
    console.log('📌 es_exento:', usuario.es_exento);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verificar si es exento
    if (usuario.es_exento) {
      const cobro = await this.crearCobro({
        turnoId,
        usuarioId,
        guiaId,
        duracionMinutos,
        costoPorHora,
        descuentoPorcentaje: 100,
        descuentoAplicado: (duracionMinutos / 60) * costoPorHora,
        total: 0,
        estado: 'exento',
        entidadId: usuario.entidad_id
      });

      return {
        total: 0,
        descuentoPorcentaje: 100,
        descuentoAplicado: (duracionMinutos / 60) * costoPorHora,
        esExento: true,
        usaBolsa: false,
        entidadId: usuario.entidad_id || undefined,
        cobroId: cobro.id
      };
    }

    // 3. Verificar bolsa de horas
    if (usuario.entidad_id) {
      const entidadQuery = await this.pool.query(
        `SELECT * FROM entidades WHERE id = $1 AND activo = true`,
        [usuario.entidad_id]
      );
      const entidad = entidadQuery.rows[0];

      if (entidad && entidad.bolsa_horas_restantes >= (duracionMinutos / 60)) {
        // Consumir de bolsa
        await this.pool.query(
          `UPDATE entidades SET bolsa_horas_restantes = bolsa_horas_restantes - $1 WHERE id = $2`,
          [duracionMinutos / 60, usuario.entidad_id]
        );

        await this.pool.query(
          `INSERT INTO consumo_bolsa (entidad_id, turno_id, usuario_id, horas_consumidas)
           VALUES ($1, $2, $3, $4)`,
          [usuario.entidad_id, turnoId, usuarioId, duracionMinutos / 60]
        );

        const cobro = await this.crearCobro({
          turnoId,
          usuarioId,
          guiaId,
          duracionMinutos,
          costoPorHora,
          descuentoPorcentaje: 0,
          descuentoAplicado: 0,
          total: 0,
          estado: 'consumido_bolsa',
          entidadId: usuario.entidad_id
        });

        return {
          total: 0,
          descuentoPorcentaje: 0,
          descuentoAplicado: 0,
          esExento: false,
          usaBolsa: true,
          entidadId: usuario.entidad_id,
          cobroId: cobro.id
        };
      }
    }

    // 4. Calcular costo normal
    let descuentoPorcentaje = usuario.descuento_personalizado || 0;
    let descuentoAplicado = 0;
    const costoBase = (duracionMinutos / 60) * costoPorHora;

    // 4.1 Verificar cupón
    if (codigoCupon) {
      const cuponQuery = await this.pool.query(
        `SELECT * FROM cupones 
         WHERE codigo = $1 
         AND activo = true 
         AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
         AND usos_actuales < usos_maximos`,
        [codigoCupon]
      );
      const cupon = cuponQuery.rows[0];
      console.log('📌 Cupón encontrado:', cupon);

      if (cupon) {
        if (cupon.tipo === 'porcentaje') {
          descuentoPorcentaje = Math.min(100, Number(descuentoPorcentaje) + Number(cupon.valor));
        } else if (cupon.tipo === 'gratis') {
          descuentoPorcentaje = 100;
        }

        // Consumir cupón
        await this.pool.query(
          `UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
          [cupon.id]
        );
      }
    }

    // 4.2 Calcular total
    let total = costoBase;
    if (descuentoPorcentaje > 0) {
      descuentoAplicado = costoBase * (descuentoPorcentaje / 100);
      total = costoBase - descuentoAplicado;
    }

    total = Math.round(total * 100) / 100;

    // 4.3 Crear cobro pendiente
    const cobro = await this.crearCobro({
      turnoId,
      usuarioId,
      guiaId,
      duracionMinutos,
      costoPorHora,
      descuentoPorcentaje,
      descuentoAplicado,
      total,
      estado: 'pendiente',
      entidadId: usuario.entidad_id
    });

    return {
      total,
      descuentoPorcentaje,
      descuentoAplicado,
      esExento: false,
      usaBolsa: false,
      entidadId: usuario.entidad_id || undefined,
      cobroId: cobro.id
    };
  }

  /**
   * Crear un registro de cobro
   */
  async crearCobro(data: {
    turnoId: string;
    usuarioId: string;
    guiaId: string;
    duracionMinutos: number;
    costoPorHora: number;
    descuentoPorcentaje: number;
    descuentoAplicado: number;
    total: number;
    estado: string;
    entidadId?: string;
  }): Promise<CobroRecord> {
    const query = `
      INSERT INTO cobros (
        turno_id, usuario_id, guia_id, entidad_id, duracion_minutos,
        costo_por_hora, descuento_porcentaje, descuento_aplicado, total, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      data.turnoId,
      data.usuarioId,
      data.guiaId,
      data.entidadId || null,
      data.duracionMinutos,
      data.costoPorHora,
      data.descuentoPorcentaje,
      data.descuentoAplicado,
      data.total,
      data.estado
    ]);
    return result.rows[0];
  }

  /**
   * Verificar si un turno tiene pago confirmado
   */
  async verificarPagoTurno(turnoId: string): Promise<{
    pagado: boolean;
    estado: string;
    cobro?: CobroRecord;
  }> {
    const query = `SELECT * FROM cobros WHERE turno_id = $1`;
    const result = await this.pool.query(query, [turnoId]);
    const cobro = result.rows[0];

    if (!cobro) {
      return { pagado: false, estado: 'sin_cobro' };
    }

    const estadosPagados = ['pagado', 'exento', 'consumido_bolsa'];
    return {
      pagado: estadosPagados.includes(cobro.estado),
      estado: cobro.estado,
      cobro
    };
  }

  /**
   * Confirmar pago (llamado por webhook o admin)
   */
  async confirmarPago(turnoId: string, metodoPago: string): Promise<CobroRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const cobroQuery = await client.query(
        `SELECT * FROM cobros WHERE turno_id = $1`,
        [turnoId]
      );
      const cobro = cobroQuery.rows[0];

      if (!cobro) {
        throw new Error('Cobro no encontrado');
      }

      if (cobro.estado === 'pagado') {
        return cobro;
      }

      await client.query(
        `UPDATE cobros SET estado = 'pagado', pagado_at = NOW(), metodo_pago = $1 WHERE id = $2`,
        [metodoPago, cobro.id]
      );

      await client.query(
        `UPDATE turnos SET estado = 'aceptado' WHERE id = $1`,
        [turnoId]
      );

      await client.query('COMMIT');

      const result = await client.query(
        `SELECT * FROM cobros WHERE id = $1`,
        [cobro.id]
      );
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Registrar pago manual (admin)
   */
  async registrarPagoManual(params: {
    turnoId: string;
    metodoPago: string;
    comprobanteUrl?: string;
    adminId: string;
  }): Promise<CobroRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { turnoId, metodoPago, comprobanteUrl, adminId } = params;

      const cobroQuery = await client.query(
        `SELECT * FROM cobros WHERE turno_id = $1`,
        [turnoId]
      );
      const cobro = cobroQuery.rows[0];

      if (!cobro) {
        throw new Error('Cobro no encontrado para este turno');
      }

      if (cobro.estado === 'pagado') {
        throw new Error('Este turno ya fue pagado');
      }

      await client.query(
        `UPDATE cobros SET estado = 'pagado', pagado_at = NOW(), metodo_pago = $1, comprobante_url = $2, creado_por = $3 WHERE id = $4`,
        [metodoPago, comprobanteUrl || null, adminId, cobro.id]
      );

      await client.query(
        `UPDATE turnos SET estado = 'aceptado' WHERE id = $1`,
        [turnoId]
      );

      await client.query('COMMIT');

      const result = await client.query(
        `SELECT * FROM cobros WHERE id = $1`,
        [cobro.id]
      );
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener cobro por turno
   */
  async obtenerCobroPorTurno(turnoId: string): Promise<CobroRecord | null> {
    const query = `SELECT * FROM cobros WHERE turno_id = $1`;
    const result = await this.pool.query(query, [turnoId]);
    return result.rows[0] || null;
  }
}