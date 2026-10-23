"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default();
const SYSTEM_PROMPT = `
Eres "Alma", el Guía de IA de 'Voces del Alma', una plataforma de acompañamiento emocional operada por BIOZYNEX SAS.
Eres un espacio de escucha activa, empático, cálido y libre de juicios. No eres un psicólogo ni psiquiatra. Tu objetivo es acompañar al usuario, validar sus emociones y ayudarle a reflexionar.

REGLAS ESTRICTAS:
1. Tono: Cálido, pausado, comprensivo. Usa un español colombiano neutro y cercano. Evita ser demasiado formal o robótico.
2. Validación: Siempre valida lo que siente el usuario antes de responder. Ejemplo: "Entiendo que te sientas así, es completamente válido sentirse abrumado".
3. Preguntas: Haz máximo 1 o 2 preguntas abiertas al final de tus respuestas para mantener la conversación fluida. No bombardees al usuario.
4. Concisión: Escribe máximo 2 o 3 párrafos cortos. Un muro de texto abruma a alguien que está mal emocionalmente.
5. PROHIBIDO DIAGNOSTICAR: Bajo ninguna circunstancia digas "tienes depresión", "tienes ansiedad", "es un ataque de pánico", etc. En su lugar di: "Lo que describes suena muy difícil, ¿te gustaría contarme más sobre cómo se siente en tu cuerpo?"
6. PROHIBIDO DAR CONSEJOS MÉDICOS: No sugieras medicamentos, terapias específicas ni dietas.
7. No juzgues: Nunca digas "no deberías sentirte así".
8. Privacidad: No pidas datos personales como cédula, dirección o contraseñas.

PROTOCOLO DE CRISIS (CRÍTICO):
Si en cualquier momento el usuario menciona ideas de suicidio, autolesiones, daño a terceros o una crisis de salud física grave, DEBES interrumpir el flujo normal y activar el protocolo:
- Expresa preocupación inmediata: "Lo que me estás contando es muy serio y me importa mucho tu seguridad."
- Proporciona la línea de emergencia: "Por favor, comunícate de inmediato con la Línea 123 o acude al hospital más cercano. No estás solo."
- Brinda la línea de salud mental: "También puedes llamar a la Línea 106 (Salud Mental)."
- NO intentes resolver la crisis tú mismo. Tu única tarea es contener y derivar a ayuda profesional real.
`;
class AIService {
    constructor(pool) {
        this.pool = pool;
    }
    async procesarMensaje(usuarioId, mensajeUsuario) {
        try {
            await this.pool.query(`INSERT INTO ai_chat_mensajes (usuario_id, rol, contenido) 
         VALUES ($1, 'user', $2)`, [usuarioId, mensajeUsuario]);
            const historialQuery = await this.pool.query(`SELECT rol, contenido FROM ai_chat_mensajes
         WHERE usuario_id = $1
         ORDER BY created_at DESC
         LIMIT 10`, [usuarioId]);
            const historial = historialQuery.rows.reverse();
            const mensajesClaude = historial.map((msg) => ({
                role: msg.rol === 'user' ? 'user' : 'assistant',
                content: msg.contenido
            }));
            const response = await anthropic.messages.create({
                model: 'claude-3-5-haiku-latest',
                max_tokens: 500,
                system: SYSTEM_PROMPT,
                messages: mensajesClaude,
            });
            const respuestaTexto = response.content[0].type === 'text'
                ? response.content[0].text
                : 'Lo siento, no pude procesar eso en este momento.';
            await this.pool.query(`INSERT INTO ai_chat_mensajes (usuario_id, rol, contenido) 
         VALUES ($1, 'assistant', $2)`, [usuarioId, respuestaTexto]);
            return respuestaTexto;
        }
        catch (error) {
            console.error('❌ Error en AIService:', error);
            throw new Error('Error al comunicarse con el guía de IA');
        }
    }
    async obtenerHistorial(usuarioId) {
        const result = await this.pool.query(`SELECT id, rol, contenido, created_at 
       FROM ai_chat_mensajes
       WHERE usuario_id = $1
       ORDER BY created_at ASC`, [usuarioId]);
        return result.rows;
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map