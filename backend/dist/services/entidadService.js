"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntidadService = void 0;
class EntidadService {
    constructor(pool) {
        this.pool = pool;
    }
    async crearEntidad(params) {
        const query = `
      INSERT INTO entidades (
        nombre, tipo, modalidad, identificador, contacto_nombre, contacto_email,
        contacto_telefono, bolsa_horas_inicial, bolsa_horas_restantes,
        dominio_corporativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const result = await this.pool.query(query, [
            params.nombre,
            params.tipo,
            params.modalidad,
            params.identificador || null,
            params.contactoNombre || null,
            params.contactoEmail || null,
            params.contactoTelefono || null,
            params.bolsaHorasInicial || 0,
            params.bolsaHorasInicial || 0,
            params.dominioCorporativo || null
        ]);
        return result.rows[0];
    }
    async obtenerEntidad(id) {
        const query = `SELECT * FROM entidades WHERE id = $1 AND activo = true`;
        const result = await this.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    async obtenerPorIdentificador(identificador) {
        const query = `SELECT * FROM entidades WHERE identificador = $1 AND activo = true`;
        const result = await this.pool.query(query, [identificador]);
        return result.rows[0] || null;
    }
    async obtenerTodas() {
        const query = `SELECT * FROM entidades WHERE activo = true ORDER BY nombre`;
        const result = await this.pool.query(query);
        return result.rows;
    }
    async agregarHorasBolsa(entidadId, horas) {
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
    async obtenerConsumoPeriodo(entidadId, desde, hasta) {
        const query = `
      SELECT 
        cb.id,
        cb.turno_id,
        cb.usuario_id,
        cb.horas_consumidas,
        cb.fecha_consumo,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email,
        u.celular AS usuario_celular,
        u.telefono AS usuario_telefono,
        t.fecha_programada AS turno_fecha
      FROM consumo_bolsa cb
      LEFT JOIN usuarios u ON u.id = cb.usuario_id
      LEFT JOIN turnos t ON t.id = cb.turno_id
      WHERE cb.entidad_id = $1 
        AND cb.fecha_consumo BETWEEN $2 AND $3
      ORDER BY cb.fecha_consumo DESC
    `;
        const result = await this.pool.query(query, [entidadId, desde, hasta]);
        const totalHoras = result.rows.reduce((sum, c) => sum + parseFloat(c.horas_consumidas), 0);
        return {
            totalHoras,
            consumos: result.rows
        };
    }
    async obtenerResumenEntidad(entidadId) {
        const entidad = await this.obtenerEntidad(entidadId);
        if (!entidad) {
            throw new Error('Entidad no encontrada');
        }
        const usuariosQuery = await this.pool.query(`SELECT id, nombre, email, es_exento FROM usuarios WHERE entidad_id = $1`, [entidadId]);
        const consumoQuery = await this.pool.query(`SELECT COALESCE(SUM(horas_consumidas), 0) as total FROM consumo_bolsa WHERE entidad_id = $1`, [entidadId]);
        return {
            entidad,
            usuarios: usuariosQuery.rows,
            consumo_total: parseFloat(consumoQuery.rows[0].total),
            horas_restantes: entidad.bolsa_horas_restantes
        };
    }
    async asignarUsuarioAEntidad(usuarioId, entidadId) {
        await this.pool.query(`UPDATE usuarios SET entidad_id = $1 WHERE id = $2`, [entidadId, usuarioId]);
    }
    async marcarUsuarioExento(usuarioId, motivo) {
        await this.pool.query(`UPDATE usuarios SET es_exento = true, motivo_exencion = $1 WHERE id = $2`, [motivo, usuarioId]);
    }
}
exports.EntidadService = EntidadService;
//# sourceMappingURL=entidadService.js.map