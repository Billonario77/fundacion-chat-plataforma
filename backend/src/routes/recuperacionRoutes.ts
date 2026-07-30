import express from 'express';
import { Request, Response } from 'express';
import { pool } from '../database/connection';
import crypto from 'crypto';

const router = express.Router();

// Generar código de 6 dígitos
const generarCodigo = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Paso 1: Solicitar código de recuperación
router.post('/solicitar', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Verificar que el usuario existe
    const usuarioQuery = await pool.query(
      'SELECT id, email FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioQuery.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con este email' });
    }

    // Generar código de 6 dígitos
    const codigo = generarCodigo();
    const expira = new Date();
    expira.setMinutes(expira.getMinutes() + 15); // Válido por 15 minutos

    // Guardar el código en la base de datos
    await pool.query(
      `INSERT INTO recuperacion_codigos (email, codigo, expira)
       VALUES ($1, $2, $3)`,
      [email, codigo, expira]
    );

    // TODO: Enviar email con el código
    // Por ahora, lo devolvemos en la respuesta (solo para desarrollo)
    console.log(`📧 Código para ${email}: ${codigo}`);

    return res.status(200).json({
      message: 'Código enviado a tu correo',
      codigo: codigo // Solo en desarrollo, eliminar en producción
    });

  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Paso 2: Verificar código y cambiar contraseña
router.post('/verificar', async (req: Request, res: Response) => {
  try {
    const { email, codigo, nuevaPassword } = req.body;

    if (!email || !codigo || !nuevaPassword) {
      return res.status(400).json({ 
        error: 'Email, código y nueva contraseña son requeridos' 
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar el código
    const query = `
      SELECT * FROM recuperacion_codigos 
      WHERE email = $1 AND codigo = $2 AND usado = false AND expira > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    const result = await pool.query(query, [email, codigo]);

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Código inválido o expirado' 
      });
    }

    // Marcar el código como usado
    await pool.query(
      'UPDATE recuperacion_codigos SET usado = true WHERE id = $1',
      [result.rows[0].id]
    );

    // Actualizar la contraseña
    await pool.query(
      'UPDATE usuarios SET password_hash = crypt($1, gen_salt($2)) WHERE email = $3',
      [nuevaPassword, 'bf', email]
    );

    return res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al verificar código:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;