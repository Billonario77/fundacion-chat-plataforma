"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuponModel = void 0;
class CuponModel {
    constructor(pool) {
        this.pool = pool;
    }
    async crear(datos) {
        const query = `
      INSERT INTO cupones (
        codigo, descripcion, tipo, valor, entidad_id, aplica_a,
        fecha_inicio, fecha_expiracion, usos_maximos, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const values = [
            datos.codigo,
            datos.descripcion || null,
            datos.tipo,
            datos.valor,
            datos.entidad_id || null,
            datos.aplica_a || 'todos',
            datos.fecha_inicio || null,
            datos.fecha_expiracion || null,
            datos.usos_maximos || 1,
            datos.activo !== undefined ? datos.activo : true
        ];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
    async obtenerPorCodigo(codigo) {
        const query = `
      SELECT * FROM cupones 
      WHERE codigo = $1 
      AND activo = true 
      AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW() AT TIME ZONE 'America/Bogota')
      AND (fecha_inicio IS NULL OR fecha_inicio <= NOW() AT TIME ZONE 'America/Bogota')
      AND usos_actuales < usos_maximos
    `;
        const result = await this.pool.query(query, [codigo]);
        return result.rows[0] || null;
    }
    async validarParaUsuario(codigo, usuarioId) {
        const query = `
      SELECT c.* FROM cupones c
      LEFT JOIN usuarios u ON u.id = $2
      WHERE c.codigo = $1 
      AND c.activo = true 
      AND (c.fecha_expiracion IS NULL OR c.fecha_expiracion > NOW() AT TIME ZONE 'America/Bogota')
      AND (c.fecha_inicio IS NULL OR c.fecha_inicio <= NOW() AT TIME ZONE 'America/Bogota')
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
    async consumirUso(id) {
        const query = `
      UPDATE cupones 
      SET usos_actuales = usos_actuales + 1,
          updated_at = NOW() AT TIME ZONE 'America/Bogota'
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }
    async obtenerTodos() {
        const query = 'SELECT * FROM cupones ORDER BY created_at DESC';
        const result = await this.pool.query(query);
        return result.rows;
    }
}
exports.CuponModel = CuponModel;
//# sourceMappingURL=Cupon.js.map