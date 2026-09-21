import { Request, Response } from 'express';
import { pool } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// ============================================
// OBTENER TODA LA CONFIGURACIÓN (Público)
// ============================================
export const obtenerConfiguracion = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT clave, valor, descripcion FROM configuracion ORDER BY clave`
    );

    // Convertir a objeto clave-valor para fácil uso en frontend
    const config: Record<string, string> = {};
    result.rows.forEach(row => {
      config[row.clave] = row.valor;
    });

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// OBTENER UNA CONFIGURACIÓN ESPECÍFICA (Público)
// ============================================
export const obtenerConfiguracionPorClave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clave } = req.params;

    const result = await pool.query(
      `SELECT clave, valor, descripcion FROM configuracion WHERE clave = $1`,
      [clave]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Configuración no encontrada' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ACTUALIZAR CONFIGURACIÓN (Admin)
// ============================================
export const actualizarConfiguracion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Acceso solo para administradores' });
      return;
    }

    const { clave, valor } = req.body;

    if (!clave || valor === undefined) {
      res.status(400).json({ error: 'Clave y valor son requeridos' });
      return;
    }

    // Verificar que la clave existe
    const existe = await pool.query(
      `SELECT clave FROM configuracion WHERE clave = $1`,
      [clave]
    );

    if (existe.rows.length === 0) {
      res.status(404).json({ error: 'Configuración no encontrada' });
      return;
    }

    await pool.query(
      `UPDATE configuracion 
       SET valor = $1, updated_at = NOW()
       WHERE clave = $2`,
      [String(valor), clave]
    );

    console.log(`⚙️ Configuración actualizada: ${clave} = ${valor} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// HELPER: Obtener valor de configuración desde el backend
// ============================================
export const getConfigValue = async (clave: string, defaultValue: string = ''): Promise<string> => {
  try {
    const result = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = $1`,
      [clave]
    );
    return result.rows[0]?.valor || defaultValue;
  } catch (error) {
    console.error(`Error al obtener configuración ${clave}:`, error);
    return defaultValue;
  }
};