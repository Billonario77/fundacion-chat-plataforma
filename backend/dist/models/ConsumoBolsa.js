"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumoBolsaModel = void 0;
class ConsumoBolsaModel {
    constructor(pool) {
        this.pool = pool;
    }
    async registrar(datos) {
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
    async obtenerPorEntidad(entidadId, desde, hasta) {
        const query = `
      SELECT * FROM consumo_bolsa 
      WHERE entidad_id = $1 
      AND fecha_consumo BETWEEN $2 AND $3
      ORDER BY fecha_consumo DESC
    `;
        const result = await this.pool.query(query, [entidadId, desde, hasta]);
        return result.rows;
    }
    async obtenerConsumoTotal(entidadId) {
        const query = 'SELECT COALESCE(SUM(horas_consumidas), 0) as total FROM consumo_bolsa WHERE entidad_id = $1';
        const result = await this.pool.query(query, [entidadId]);
        return parseFloat(result.rows[0].total);
    }
}
exports.ConsumoBolsaModel = ConsumoBolsaModel;
//# sourceMappingURL=ConsumoBolsa.js.map