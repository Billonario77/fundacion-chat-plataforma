"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CobroModel = void 0;
class CobroModel {
    constructor(pool) {
        this.pool = pool;
    }
    async crear(datos) {
        const query = `
      INSERT INTO cobros (
        turno_id, usuario_id, guia_id, entidad_id, duracion_minutos,
        costo_por_hora, descuento_porcentaje, descuento_aplicado, total,
        estado, metodo_pago, comprobante_url, preferencia_id, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
        const values = [
            datos.turno_id,
            datos.usuario_id,
            datos.guia_id,
            datos.entidad_id || null,
            datos.duracion_minutos,
            datos.costo_por_hora,
            datos.descuento_porcentaje || 0,
            datos.descuento_aplicado || 0,
            datos.total,
            datos.estado,
            datos.metodo_pago || null,
            datos.comprobante_url || null,
            datos.preferencia_id || null,
            datos.creado_por || null
        ];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
    async obtenerPorId(id) {
        const query = 'SELECT * FROM cobros WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    async obtenerPorTurnoId(turnoId) {
        const query = 'SELECT * FROM cobros WHERE turno_id = $1';
        const result = await this.pool.query(query, [turnoId]);
        return result.rows[0] || null;
    }
    async obtenerPorPreferenciaId(preferenciaId) {
        const query = 'SELECT * FROM cobros WHERE preferencia_id = $1';
        const result = await this.pool.query(query, [preferenciaId]);
        return result.rows[0] || null;
    }
    async actualizarEstado(id, estado, pagadoAt) {
        const query = `
      UPDATE cobros 
      SET estado = $1,
          pagado_at = COALESCE($2, pagado_at),
          updated_at = NOW() AT TIME ZONE 'America/Bogota'
      WHERE id = $3
      RETURNING *
    `;
        const result = await this.pool.query(query, [estado, pagadoAt || null, id]);
        return result.rows[0] || null;
    }
    async actualizarMetodoPago(id, metodoPago, preferenciaId) {
        const query = `
      UPDATE cobros 
      SET metodo_pago = $1,
          preferencia_id = COALESCE($2, preferencia_id),
          updated_at = NOW() AT TIME ZONE 'America/Bogota'
      WHERE id = $3
      RETURNING *
    `;
        const result = await this.pool.query(query, [metodoPago, preferenciaId || null, id]);
        return result.rows[0] || null;
    }
    async obtenerHistorialUsuario(usuarioId, limit = 20) {
        const query = `
      SELECT c.*, t.fecha_programada, t.estado as turno_estado
      FROM cobros c
      JOIN turnos t ON t.id = c.turno_id
      WHERE c.usuario_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `;
        const result = await this.pool.query(query, [usuarioId, limit]);
        return result.rows;
    }
    async obtenerEstadisticas() {
        const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END) as fallidos,
        SUM(CASE WHEN estado = 'exento' THEN 1 ELSE 0 END) as exentos,
        SUM(CASE WHEN estado = 'consumido_bolsa' THEN 1 ELSE 0 END) as consumidos_bolsa,
        COALESCE(SUM(total), 0) as total_recaudado
      FROM cobros
    `;
        const result = await this.pool.query(query);
        return result.rows[0];
    }
}
exports.CobroModel = CobroModel;
//# sourceMappingURL=Cobro.js.map