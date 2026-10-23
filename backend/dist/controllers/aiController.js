"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarMensajePublico = exports.obtenerHistorialChat = exports.enviarMensaje = void 0;
const connection_1 = require("../database/connection");
const aiService_1 = require("../services/aiService");
const aiService = new aiService_1.AIService(connection_1.pool);
const enviarMensaje = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const { mensaje } = req.body;
        if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }
        if (mensaje.length > 2000) {
            return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' });
        }
        const respuesta = await aiService.procesarMensaje(usuarioId, mensaje.trim());
        res.json({
            success: true,
            data: { respuesta },
        });
    }
    catch (error) {
        console.error('Error al enviar mensaje a Alma:', error);
        res.status(500).json({
            error: error.message || 'Error al comunicarse con el guía de IA. Por favor, intenta de nuevo.'
        });
    }
};
exports.enviarMensaje = enviarMensaje;
const obtenerHistorialChat = async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const historial = await aiService.obtenerHistorial(usuarioId);
        res.json({
            success: true,
            data: historial,
        });
    }
    catch (error) {
        console.error('Error al obtener historial de Alma:', error);
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
};
exports.obtenerHistorialChat = obtenerHistorialChat;
const enviarMensajePublico = async (req, res) => {
    try {
        const { historial } = req.body;
        if (!historial || !Array.isArray(historial) || historial.length === 0) {
            return res.status(400).json({ error: 'El historial es requerido' });
        }
        const respuesta = await aiService.procesarMensajePublico(historial);
        res.json({
            success: true,
            data: { respuesta },
        });
    }
    catch (error) {
        console.error('Error al enviar mensaje público:', error);
        res.status(500).json({ error: 'Error al comunicarse con el guía.' });
    }
};
exports.enviarMensajePublico = enviarMensajePublico;
//# sourceMappingURL=aiController.js.map