import { Pool } from 'pg';
import crypto from 'crypto';

export class CuponService {
  constructor(private pool: Pool) {}

  /**
   * Generar código único para cupón
   */
  generarCodigo(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Crear cupón
   */
  async crearCupon(params: {
    descripcion: string;
    tipo: 'porcentaje' | 'fijo' | 'gratis';
    valor: number;
    entidadId?: string;
    aplicaA?: 'nuevos' | 'antiguos' | 'todos';
    fechaInicio?: Date;
    fechaExpiracion?: Date;
    usosMaximos?: number;
  }): Promise<any> {
    const codigo = this.generarCodigo();
    const query = `
      INSERT INTO cupones (
        codigo, descripcion, tipo, valor, entidad_id, aplica_a,
        fecha_inicio, fecha_expiracion, usos_maximos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      codigo,
      params.descripcion,
      params.tipo,
      params.valor,
      params.entidadId || null,
      params.aplicaA || 'todos',
      params.fechaInicio || null,
      params.fechaExpiracion || null,
      params.usosMaximos || 1
    ]);
    return result.rows[0];
  }

  /**
   * Validar cupón para usuario
   */
  async validarCupon(codigo: string, usuarioId: string): Promise<any> {
    const query = `
      SELECT c.* FROM cupones c
      LEFT JOIN usuarios u ON u.id = $2
      WHERE c.codigo = $1 
      AND c.activo = true 
      AND (c.fecha_expiracion IS NULL OR c.fecha_expiracion > NOW())
      AND (c.fecha_inicio IS NULL OR c.fecha_inicio <= NOW())
      AND c.usos_actuales < c.usos_maximos
      AND (
        c.aplica_a = 'todos' 
        OR (c.aplica_a = 'nuevos' AND u.es_nuevo = true)
        OR (c.aplica_a = 'antiguos' AND u.es_nuevo = false)
      )
    `;
    const result = await this.pool.query(query, [codigo, usuarioId]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los cupones activos
   */
  async obtenerCuponesActivos(): Promise<any[]> {
    const query = `
      SELECT * FROM cupones 
      WHERE activo = true 
      AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
      AND usos_actuales < usos_maximos
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Desactivar cupón
   */
  async desactivarCupon(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE cupones SET activo = false WHERE id = $1`,
      [id]
    );
  }

  /**
   * Obtener cupón por código
   */
  async obtenerPorCodigo(codigo: string): Promise<any> {
    const query = `SELECT * FROM cupones WHERE codigo = $1`;
    const result = await this.pool.query(query, [codigo]);
    return result.rows[0] || null;
  }
}