"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuponService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class CuponService {
    constructor(pool) {
        this.pool = pool;
    }
    generarCodigo() {
        return crypto_1.default.randomBytes(6).toString('hex').toUpperCase();
    }
    async crearCupon(params) {
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
    async validarCupon(codigo, usuarioId) {
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
    async canjearCuponBolsa(codigo, usuarioId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const cuponQuery = await client.query(`SELECT * FROM cupones WHERE codigo = $1 FOR UPDATE`, [codigo]);
            const cupon = cuponQuery.rows[0];
            if (!cupon || !cupon.activo) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'no_encontrado', mensaje: 'Cupón no encontrado o inactivo.' };
            }
            if (cupon.tipo !== 'bolsa') {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'no_bolsa', mensaje: 'Este cupón no es de bolsa de horas.' };
            }
            if (!cupon.entidad_id) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'sin_entidad', mensaje: 'El cupón no tiene una entidad asociada.' };
            }
            if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) <= new Date()) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'no_encontrado', mensaje: 'El cupón ya expiró.' };
            }
            if (cupon.usos_actuales >= cupon.usos_maximos) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'sin_usos', mensaje: 'El cupón ya alcanzó su número máximo de usos.' };
            }
            const entidadQuery = await client.query(`SELECT * FROM entidades WHERE id = $1 AND activo = true`, [cupon.entidad_id]);
            const entidad = entidadQuery.rows[0];
            if (!entidad || entidad.modalidad !== 'bolsa') {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'entidad_invalida', mensaje: 'La entidad del cupón no está activa o no es de modalidad bolsa.' };
            }
            if (!entidad.dominio_corporativo) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'dominio_no_configurado', mensaje: 'La entidad no tiene configurado un dominio corporativo.' };
            }
            const usuarioQuery = await client.query(`SELECT id, email, entidad_id FROM usuarios WHERE id = $1`, [usuarioId]);
            const usuario = usuarioQuery.rows[0];
            if (!usuario) {
                await client.query('ROLLBACK');
                return { ok: false, codigoError: 'no_encontrado', mensaje: 'Usuario no encontrado.' };
            }
            if (usuario.entidad_id) {
                await client.query('ROLLBACK');
                return {
                    ok: false,
                    codigoError: 'ya_vinculado',
                    mensaje: 'Ya perteneces a un convenio. Contacta al administrador si necesitas cambiarlo.'
                };
            }
            const dominioEsperado = String(entidad.dominio_corporativo).toLowerCase().trim();
            const emailUsuario = String(usuario.email).toLowerCase().trim();
            const dominioUsuario = emailUsuario.split('@')[1] || '';
            if (dominioUsuario !== dominioEsperado) {
                await client.query('ROLLBACK');
                return {
                    ok: false,
                    codigoError: 'dominio_no_coincide',
                    mensaje: `Tu correo (${emailUsuario}) no pertenece al dominio del convenio (@${dominioEsperado}).`
                };
            }
            const updateUsuario = await client.query(`UPDATE usuarios SET entidad_id = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, nombre, email, entidad_id`, [entidad.id, usuarioId]);
            await client.query(`UPDATE cupones SET usos_actuales = usos_actuales + 1, updated_at = NOW() WHERE id = $1`, [cupon.id]);
            await client.query('COMMIT');
            return {
                ok: true,
                entidad,
                usuario: updateUsuario.rows[0]
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async obtenerCuponesActivos() {
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
    async desactivarCupon(id) {
        await this.pool.query(`UPDATE cupones SET activo = false WHERE id = $1`, [id]);
    }
    async obtenerPorCodigo(codigo) {
        const query = `SELECT * FROM cupones WHERE codigo = $1`;
        const result = await this.pool.query(query, [codigo]);
        return result.rows[0] || null;
    }
}
exports.CuponService = CuponService;
//# sourceMappingURL=cuponService.js.map