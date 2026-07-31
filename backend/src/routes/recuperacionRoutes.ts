import express from 'express';
import { Request, Response } from 'express';
import { pool } from '../database/connection';

const nodemailer = require('nodemailer');
const router = express.Router();

// Configurar transporte SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true', // true para puerto 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
      'SELECT id, email, nombre FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioQuery.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con este email' });
    }

    const usuario = usuarioQuery.rows[0];

    // Generar código de 6 dígitos
    const codigo = generarCodigo();
    const expira = new Date();
    expira.setMinutes(expira.getMinutes() + 30);

    // Guardar el código en la base de datos
    await pool.query(
      `INSERT INTO recuperacion_codigos (email, codigo, expira)
       VALUES ($1, $2, $3)`,
      [email, codigo, expira]
    );

    // 📧 ENVIAR EMAIL CON NODEMAILER
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Código de recuperación de contraseña',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #4a6cf7;">Código de recuperación</h2>
            <p>Hola <strong>${usuario.nombre || 'usuario'}</strong>,</p>
            <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para restablecerla:</p>
            <div style="background-color: #f0f4ff; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #4a6cf7; margin: 20px 0;">
              ${codigo}
            </div>
            <p>Este código es válido por <strong>30 minutos</strong>.</p>
            <p>Si no solicitaste este código, ignora este mensaje.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">Fundación - Plataforma de apoyo</p>
          </div>
        `
      });
      console.log(`📧 Email enviado a: ${email} con código: ${codigo}`);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);
      // No detenemos el flujo, solo registramos el error
    }

    return res.status(200).json({
      message: 'Código enviado a tu correo'
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

    console.log('📥 Verificación recibida:', { email, codigo, nuevaPassword: '***' });

    if (!email || !codigo || !nuevaPassword) {
      console.log('❌ Faltan campos:', { email: !!email, codigo: !!codigo, nuevaPassword: !!nuevaPassword });
      return res.status(400).json({ 
        error: 'Email, código y nueva contraseña son requeridos' 
      });
    }

    if (nuevaPassword.length < 6) {
      console.log('❌ Contraseña muy corta:', nuevaPassword.length);
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar el código (con zona horaria Colombia)
    const query = `
      SELECT * FROM recuperacion_codigos 
      WHERE email = $1 AND codigo = $2 AND usado = false 
      AND expira > (NOW() - INTERVAL '5 hours')
      ORDER BY created_at DESC LIMIT 1
    `;

    console.log('🔍 Buscando código en BD:', { email, codigo });
    const result = await pool.query(query, [email, codigo]);
    console.log('📊 Resultado de búsqueda:', result.rows.length > 0 ? '✅ Encontrado' : '❌ No encontrado');

    if (result.rows.length === 0) {
      console.log('❌ Código inválido o expirado');
      return res.status(400).json({ 
        error: 'Código inválido o expirado' 
      });
    }

    console.log('✅ Código válido, actualizando contraseña...');

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

    console.log('✅ Contraseña actualizada exitosamente para:', email);

    return res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al verificar código:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;