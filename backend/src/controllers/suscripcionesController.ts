import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../database/connection';
import { SuscripcionService, PlanSuscripcion } from '../services/suscripcionService';
import { WompiService } from '../services/wompiService';

const suscripcionService = new SuscripcionService(pool);
const wompiService = new WompiService();

const PLANES_VALIDOS: PlanSuscripcion[] = ['bienestar', 'refugio', 'santuario'];

// ============================================
// LISTAR PLANES DISPONIBLES
// ============================================
export const listarPlanes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const planes = await suscripcionService.obtenerPlanes();
    const multasPendientes = await suscripcionService.obtenerMultasPendientesMonto(req.user.id);

    res.json({
      success: true,
      data: {
        planes: [
          { id: 'bienestar', nombre: 'Bienestar', ...planes.bienestar },
          { id: 'refugio',   nombre: 'Refugio',   ...planes.refugio   },
          { id: 'santuario', nombre: 'Santuario', ...planes.santuario },
        ],
        multasPendientes,
      },
    });
  } catch (error: any) {
    console.error('Error al listar planes:', error);
    res.status(500).json({ error: error.message || 'Error al listar planes' });
  }
};

// ============================================
// INICIAR PAGO DE SUSCRIPCIÓN
// ============================================
export const iniciarPago = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { plan } = req.body;

    if (!plan || !PLANES_VALIDOS.includes(plan)) {
      return res.status(400).json({
        error: 'Plan inválido. Debe ser: bienestar, refugio o santuario',
      });
    }

    // Bloquear si ya tiene una suscripción pendiente sin pagar
    const pendiente = await pool.query(
      `SELECT id FROM suscripciones
       WHERE usuario_id = $1
         AND estado_pago = 'pendiente'
         AND created_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`,
      [usuarioId]
    );

    if (pendiente.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya tienes un pago de suscripción pendiente. Completa o espera 1 hora antes de iniciar otro.',
      });
    }

    // Obtener multas pendientes (Opción B: se suman al precio)
    const multasPendientes = await suscripcionService.obtenerMultasPendientesMonto(usuarioId);

    // Crear la suscripción pendiente
    const suscripcion = await suscripcionService.crearPendiente(
      usuarioId,
      plan as PlanSuscripcion,
      multasPendientes
    );

    // Generar firma Wompi
    const montoEnCentavos = Math.round(parseFloat(String(suscripcion.precio_pagado)) * 100);
    const firmaIntegridad = wompiService.generarFirmaIntegridad(
      suscripcion.referencia_wompi!,
      montoEnCentavos,
      'COP'
    );

    res.json({
      success: true,
      data: {
        suscripcionId: suscripcion.id,
        plan: suscripcion.plan,
        sesionesIncluidas: suscripcion.sesiones_incluidas,
        precioPlan: parseFloat(String(suscripcion.precio_pagado)) - multasPendientes,
        multasPendientes,
        precioTotal: parseFloat(String(suscripcion.precio_pagado)),
        referencia: suscripcion.referencia_wompi,
        montoEnCentavos,
        firmaIntegridad,
        publicKey: wompiService.getPublicKey(),
        moneda: 'COP',
      },
    });
  } catch (error: any) {
    console.error('Error al iniciar pago de suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar pago' });
  }
};

// ============================================
// OBTENER MI PLAN ACTIVO
// ============================================
export const miPlan = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const suscripcion = await suscripcionService.obtenerPlanActivo(usuarioId);

    if (!suscripcion) {
      return res.json({ success: true, data: null });
    }

    const sesionesRestantes = suscripcion.sesiones_incluidas - suscripcion.sesiones_usadas;
    const diasRestantes = Math.max(
      0,
      Math.ceil(
        (new Date(suscripcion.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    res.json({
      success: true,
      data: {
        id: suscripcion.id,
        plan: suscripcion.plan,
        sesionesIncluidas: suscripcion.sesiones_incluidas,
        sesionesUsadas: suscripcion.sesiones_usadas,
        sesionesRestantes,
        fechaInicio: suscripcion.fecha_inicio,
        fechaFin: suscripcion.fecha_fin,
        diasRestantes,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener mi plan:', error);
    res.status(500).json({ error: error.message || 'Error al obtener plan' });
  }
};

// ============================================
// HISTORIAL DE SUSCRIPCIONES DEL USUARIO
// ============================================
export const historial = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const lista = await suscripcionService.obtenerHistorial(usuarioId);

    res.json({ success: true, data: lista });
  } catch (error: any) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: error.message || 'Error al obtener historial' });
  }
};