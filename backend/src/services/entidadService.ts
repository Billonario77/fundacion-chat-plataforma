import { Pool } from 'pg';

export class EntidadService {
  constructor(private pool: Pool) {}

  /**
   * Crear entidad con bolsa de horas
   */
  async crearEntidad(params: {
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    identificador?: string;
    contactoNombre?: string;
    contactoEmail?: string;
    contactoTelefono?: string;
    descuentoPorcentaje?: number;
    bolsaHorasInicial?: number;
  }): Promise<any> {
    const query = `
      INSERT INTO entidades (
        nombre, tipo, identificador, contacto_nombre, contacto_email,
        contacto_telefono, descuento_porcentaje, bolsa_horas_inicial,
        bolsa_horas_restantes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      params.nombre,
      params.tipo,
      params.identificador || null,
      params.contactoNombre || null,
      params.contactoEmail || null,
      params.contactoTelefono || null,
      params.descuentoPorcentaje || 0,
      params.bolsaHorasInicial || 0,
      params.bolsaHorasInicial || 0
    ]);
    return result.rows[0];
  }

  /**
   * Obtener entidad por ID
   */
  async obtenerEntidad(id: string): Promise<any> {
    const query = `SELECT * FROM entidades WHERE id = $1 AND activo = true`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener entidad por identificador
   */
  async obtenerPorIdentificador(identificador: string): Promise<any> {
    const query = `SELECT * FROM entidades WHERE identificador = $1 AND activo = true`;
    const result = await this.pool.query(query, [identificador]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todas las entidades activas
   */
  async obtenerTodas(): Promise<any[]> {
    const query = `SELECT * FROM entidades WHERE activo = true ORDER BY nombre`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Agregar horas a la bolsa de una entidad
   */
  async agregarHorasBolsa(entidadId: string, horas: number): Promise<any> {
    const query = `
      UPDATE entidades 
      SET bolsa_horas_restantes = bolsa_horas_restantes + $1,
          bolsa_horas_inicial = bolsa_horas_inicial + $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.pool.query(query, [horas, horas, entidadId]);
    return result.rows[0];
  }

  /**
   * Obtener consumo de horas por entidad en un período
   */
  async obtenerConsumoPeriodo(entidadId: string, desde: Date, hasta: Date): Promise<{
    totalHoras: number;
    consumos: any[];
  }> {
    const query = `
      SELECT * FROM consumo_bolsa 
      WHERE entidad_id = $1 
      AND fecha_consumo BETWEEN $2 AND $3
      ORDER BY fecha_consumo DESC
    `;
    const result = await this.pool.query(query, [entidadId, desde, hasta]);
    const totalHoras = result.rows.reduce((sum, c) => sum + c.horas_consumidas, 0);
    return {
      totalHoras,
      consumos: result.rows
    };
  }

  /**
   * Obtener resumen de entidad
   */
  async obtenerResumenEntidad(entidadId: string): Promise<any> {
    const entidad = await this.obtenerEntidad(entidadId);
    if (!entidad) {
      throw new Error('Entidad no encontrada');
    }

    // Obtener usuarios asociados
    const usuariosQuery = await this.pool.query(
      `SELECT id, nombre, email, es_exento FROM usuarios WHERE entidad_id = $1`,
      [entidadId]
    );

    // Obtener consumo total
    const consumoQuery = await this.pool.query(
      `SELECT COALESCE(SUM(horas_consumidas), 0) as total FROM consumo_bolsa WHERE entidad_id = $1`,
      [entidadId]
    );

    return {
      entidad,
      usuarios: usuariosQuery.rows,
      consumo_total: parseFloat(consumoQuery.rows[0].total),
      horas_restantes: entidad.bolsa_horas_restantes
    };
  }

  /**
   * Asignar usuario a entidad
   */
  async asignarUsuarioAEntidad(usuarioId: string, entidadId: string): Promise<void> {
    await this.pool.query(
      `UPDATE usuarios SET entidad_id = $1 WHERE id = $2`,
      [entidadId, usuarioId]
    );
  }

  /**
   * Marcar usuario como exento
   */
  async marcarUsuarioExento(usuarioId: string, motivo: string): Promise<void> {
    await this.pool.query(
      `UPDATE usuarios SET es_exento = true, motivo_exencion = $1 WHERE id = $2`,
      [motivo, usuarioId]
    );
  }
}