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
4. Concisión EXTREMA: Escribe máximo 2 o 3 FRASES CORTAS (no párrafos). Alguien con dolor emocional no puede leer muros de texto. Sé directo, cálido y ve al punto. Si haces una pregunta, que sea una sola.
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
                model: 'claude-haiku-4-5',
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
    async procesarMensajePublico(historial) {
        try {
            const systemPublico = `
        Eres "Alma", el Guía de IA de Voces del Alma.
        El usuario con el que hablas NO ha iniciado sesión.
        Tus reglas principales (empatía, no diagnosticar, protocolo de crisis 123/106) siguen aplicando.

        REGLA DE BREVEDAD EXTREMA (OBLIGATORIA):
        - Escribe MÁXIMO 2 FRASES CORTAS. No uses listas, viñetas ni párrafos largos.
        - Valida su emoción en 1 frase y haz una sola pregunta corta.

        REGLA DE INVITACIÓN (OBLIGATORIA):
        - Después de la primera respuesta empática, en tu segunda o tercera intervención, debes invitarlo a registrarse. Dile algo como: "Me encantaría seguir escuchándote, pero para guardar nuestro historial y darte un espacio seguro, te invito a crear una cuenta. ¿Te gustaría hacerlo?".

        Historial de conversación:
        ${historial.map(m => `${m.rol === 'user' ? 'Usuario' : 'Alma'}: ${m.contenido}`).join('\n')}
      `;
            const response = await anthropic.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 500,
                system: systemPublico,
                messages: historial.map(m => ({
                    role: m.rol === 'user' ? 'user' : 'assistant',
                    content: m.contenido
                })),
            });
            return response.content[0].type === 'text' ? response.content[0].text : 'Lo siento, no pude procesar eso.';
        }
        catch (error) {
            console.error('❌ Error en AIService (público):', error);
            throw new Error('Error al comunicarse con el guía de IA');
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map