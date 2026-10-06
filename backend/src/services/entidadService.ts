import { Pool } from 'pg';

export class EntidadService {
  constructor(private pool: Pool) {}

    /**
   * Crear entidad con bolsa de horas
   */
  async crearEntidad(params: {
    nombre: string;
    tipo: 'empresa' | 'ong' | 'gobierno';
    modalidad: 'descuento' | 'bolsa';
    identificador?: string;
    contactoNombre?: string;
    contactoEmail?: string;
    contactoTelefono?: string;
    bolsaHorasInicial?: number;
    dominioCorporativo?: string;
  }): Promise<any> {
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
   * Obtener consumo de horas por entidad en un período (con datos del usuario)
   */
    async obtenerConsumoPeriodo(entidadId: string, desde: Date, hasta: Date): Promise<{
    totalHoras: number;
    consumos: any[];
  }> {
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
    const totalHoras = result.rows.reduce(
      (sum, c) => sum + parseFloat(c.horas_consumidas),
      0
    );
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
   * Asignar usuario a entidad (o desvincular si entidadId es null)
   */
  async asignarUsuarioAEntidad(usuarioId: string, entidadId: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE usuarios SET entidad_id = $1, updated_at = NOW() WHERE id = $2`,
      [entidadId, usuarioId]
    );
  }


  /**
   * Procesar un email para vincularlo a un convenio.
   * - Si el usuario ya existe: lo vincula directo.
   * - Si no existe: lo guarda en correos_autorizados_convenio como pendiente.
   */
  async asignarUsuarioPorEmail(
    email: string,
    entidadId: string
  ): Promise<
    | { ok: true; tipo: 'vinculado'; usuario: any }
    | { ok: true; tipo: 'pendiente'; email: string }
    | { ok: false; motivo: string; mensaje: string }
  > {
    const emailNorm = String(email).trim().toLowerCase();

    // Validar formato mínimo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return { ok: false, motivo: 'formato_invalido', mensaje: `Formato de email inválido: ${emailNorm}` };
    }

    // 1. Buscar usuario existente
    const usuarioQuery = await this.pool.query(
      `SELECT id, nombre, email, entidad_id FROM usuarios WHERE LOWER(email) = $1`,
      [emailNorm]
    );

    if (usuarioQuery.rows.length > 0) {
      const usuario = usuarioQuery.rows[0];

      if (usuario.entidad_id === entidadId) {
        return { ok: false, motivo: 'ya_vinculado', mensaje: `${emailNorm} ya está vinculado a este convenio` };
      }

      if (usuario.entidad_id && usuario.entidad_id !== entidadId) {
        return { ok: false, motivo: 'otro_convenio', mensaje: `${emailNorm} ya pertenece a otro convenio` };
      }

      await this.pool.query(
        `UPDATE usuarios SET entidad_id = $1, updated_at = NOW() WHERE id = $2`,
        [entidadId, usuario.id]
      );

      return {
        ok: true,
        tipo: 'vinculado',
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
      };
    }

    // 2. No existe: guardar como autorizado pendiente
    //    Verificar que no esté autorizado en otro convenio
    const existenteQuery = await this.pool.query(
      `SELECT id, entidad_id, usado FROM correos_autorizados_convenio WHERE email = $1`,
      [emailNorm]
    );

    if (existenteQuery.rows.length > 0) {
      const existente = existenteQuery.rows[0];
      if (existente.entidad_id === entidadId) {
        return {
          ok: false,
          motivo: 'ya_autorizado',
          mensaje: `${emailNorm} ya está en la lista de este convenio (pendiente de registro)`
        };
      }
      return {
        ok: false,
        motivo: 'autorizado_otro_convenio',
        mensaje: `${emailNorm} ya está autorizado en otro convenio`
      };
    }

    await this.pool.query(
      `INSERT INTO correos_autorizados_convenio (entidad_id, email)
       VALUES ($1, $2)`,
      [entidadId, emailNorm]
    );

    return { ok: true, tipo: 'pendiente', email: emailNorm };
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