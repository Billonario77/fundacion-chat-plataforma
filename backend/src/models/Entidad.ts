import { Pool } from 'pg';

export interface Entidad {
  id: string;
  nombre: string;
  tipo: 'empresa' | 'ong' | 'gobierno';
  identificador?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
  descuento_porcentaje: number;
  bolsa_horas_inicial: number;
  bolsa_horas_restantes: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export class EntidadModel {
  constructor(private pool: Pool) {}

  async crear(datos: Omit<Entidad, 'id' | 'created_at' | 'updated_at'>): Promise<Entidad> {
    const query = `
      INSERT INTO entidades (
        nombre, tipo, identificador, contacto_nombre, contacto_email,
        contacto_telefono, descuento_porcentaje, bolsa_horas_inicial,
        bolsa_horas_restantes, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      datos.nombre,
      datos.tipo,
      datos.identificador || null,
      datos.contacto_nombre || null,
      datos.contacto_email || null,
      datos.contacto_telefono || null,
      datos.descuento_porcentaje || 0,
      datos.bolsa_horas_inicial || 0,
      datos.bolsa_horas_restantes || 0,
      datos.activo !== undefined ? datos.activo : true
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async obtenerPorId(id: string): Promise<Entidad | null> {
    const query = 'SELECT * FROM entidades WHERE id = $1 AND activo = true';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async obtenerPorIdentificador(identificador: string): Promise<Entidad | null> {
    const query = 'SELECT * FROM entidades WHERE identificador = $1 AND activo = true';
    const result = await this.pool.query(query, [identificador]);
    return result.rows[0] || null;
  }

  async obtenerTodas(): Promise<Entidad[]> {
    const query = 'SELECT * FROM entidades WHERE activo = true ORDER BY nombre';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async actualizarBolsaHoras(id: string, horasUsadas: number): Promise<Entidad> {
    const query = `
      UPDATE entidades 
      SET bolsa_horas_restantes = bolsa_horas_restantes - $1,
          updated_at = NOW() AT TIME ZONE 'America/Bogota'
      WHERE id = $2 AND activo = true
      RETURNING *
    `;
    const result = await this.pool.query(query, [horasUsadas, id]);
    return result.rows[0];
  }

  async actualizar(id: string, datos: Partial<Entidad>): Promise<Entidad | null> {
    const campos: string[] = [];
    const valores: any[] = [];
    let idx = 1;

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        campos.push(`${key} = $${idx}`);
        valores.push(value);
        idx++;
      }
    });

    if (campos.length === 0) return null;

    campos.push(`updated_at = NOW() AT TIME ZONE 'America/Bogota'`);
    valores.push(id);

    const query = `
      UPDATE entidades 
      SET ${campos.join(', ')}
      WHERE id = $${valores.length} AND activo = true
      RETURNING *
    `;
    const result = await this.pool.query(query, valores);
    return result.rows[0] || null;
  }
}