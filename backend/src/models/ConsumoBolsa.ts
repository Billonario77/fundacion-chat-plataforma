import { Pool } from 'pg';

export interface ConsumoBolsa {
  id: string;
  entidad_id: string;
  turno_id: string;
  usuario_id: string;
  horas_consumidas: number;
  fecha_consumo: Date;
  created_at: Date;
}

export class ConsumoBolsaModel {
  constructor(private pool: Pool) {}

  async registrar(datos: Omit<ConsumoBolsa, 'id' | 'fecha_consumo' | 'created_at'>): Promise<ConsumoBolsa> {
    const query = `
      INSERT INTO consumo_bolsa (
        entidad_id, turno_id, usuario_id, horas_consumidas
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      datos.entidad_id,
      datos.turno_id,
      datos.usuario_id,
      datos.horas_consumidas
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async obtenerPorEntidad(entidadId: string, desde: Date, hasta: Date): Promise<ConsumoBolsa[]> {
    const query = `
      SELECT * FROM consumo_bolsa 
      WHERE entidad_id = $1 
      AND fecha_consumo BETWEEN $2 AND $3
      ORDER BY fecha_consumo DESC
    `;
    const result = await this.pool.query(query, [entidadId, desde, hasta]);
    return result.rows;
  }

  async obtenerConsumoTotal(entidadId: string): Promise<number> {
    const query = 'SELECT COALESCE(SUM(horas_consumidas), 0) as total FROM consumo_bolsa WHERE entidad_id = $1';
    const result = await this.pool.query(query, [entidadId]);
    return parseFloat(result.rows[0].total);
  }
}