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
    tipo: 'porcentaje' | 'fijo' | 'gratis' | 'bolsa';
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
   * Canjear un cupón de tipo 'bolsa' para vincular al usuario con la entidad.
   *
   * Reglas:
   * - Solo aplica a cupones tipo 'bolsa' con entidad_id asignada.
   * - El correo del usuario debe terminar en el dominio corporativo de la entidad.
   * - El usuario no debe tener ya otra entidad asignada.
   * - Se consume 1 uso del cupón.
   */
  async canjearCuponBolsa(
    codigo: string,
    usuarioId: string
  ): Promise<
    | { ok: true; entidad: any; usuario: any }
    | {
        ok: false;
        codigoError:
          | 'no_encontrado'
          | 'no_bolsa'
          | 'sin_entidad'
          | 'entidad_invalida'
          | 'dominio_no_configurado'
          | 'dominio_no_coincide'
          | 'ya_vinculado'
          | 'sin_usos';
        mensaje: string;
      }
  > {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Bloquear la fila del cupón para evitar canjes concurrentes
      const cuponQuery = await client.query(
        `SELECT * FROM cupones WHERE codigo = $1 FOR UPDATE`,
        [codigo]
      );

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

      // 2. Validar la entidad
      const entidadQuery = await client.query(
        `SELECT * FROM entidades WHERE id = $1 AND activo = true`,
        [cupon.entidad_id]
      );
      const entidad = entidadQuery.rows[0];

      if (!entidad || entidad.modalidad !== 'bolsa') {
        await client.query('ROLLBACK');
        return { ok: false, codigoError: 'entidad_invalida', mensaje: 'La entidad del cupón no está activa o no es de modalidad bolsa.' };
      }

      if (!entidad.dominio_corporativo) {
        await client.query('ROLLBACK');
        return { ok: false, codigoError: 'dominio_no_configurado', mensaje: 'La entidad no tiene configurado un dominio corporativo.' };
      }

      // 3. Validar el usuario
      const usuarioQuery = await client.query(
        `SELECT id, email, entidad_id FROM usuarios WHERE id = $1`,
        [usuarioId]
      );
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

      // 4. Validar dominio del correo
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

      // 5. Vincular usuario a la entidad
      const updateUsuario = await client.query(
        `UPDATE usuarios SET entidad_id = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, nombre, email, entidad_id`,
        [entidad.id, usuarioId]
      );

      // 6. Consumir 1 uso del cupón
      await client.query(
        `UPDATE cupones SET usos_actuales = usos_actuales + 1, updated_at = NOW() WHERE id = $1`,
        [cupon.id]
      );

      await client.query('COMMIT');

      return {
        ok: true,
        entidad,
        usuario: updateUsuario.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
   * Obtener todos los cupones asociados a una entidad (convenio)
   */
  async obtenerCuponesDeEntidad(entidadId: string): Promise<any[]> {
    const query = `
      SELECT 
        id, codigo, descripcion, tipo, valor, entidad_id, aplica_a,
        fecha_inicio, fecha_expiracion, usos_maximos, usos_actuales,
        activo, created_at
      FROM cupones
      WHERE entidad_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [entidadId]);
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