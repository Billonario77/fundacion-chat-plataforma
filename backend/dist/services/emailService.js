"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarEmail = exports.enviarAgradecimientoDonacion = exports.enviarRecordatorio2h = exports.enviarRecordatorio24h = exports.enviarConfirmacionPago = void 0;
const nodemailer = __importStar(require("nodemailer"));
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const enviarEmail = async (opciones) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: opciones.to,
            subject: opciones.subject,
            html: opciones.html,
        });
        console.log(`📧 Email enviado a: ${opciones.to} - Asunto: ${opciones.subject}`);
        return true;
    }
    catch (error) {
        console.error('❌ Error al enviar email:', error);
        return false;
    }
};
exports.enviarEmail = enviarEmail;
const templateBase = (contenido) => `
  <div style="font-family: 'Georgia', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FDF6EC;">
    <div style="background: linear-gradient(135deg, #F2CC8F 0%, #E07A5F 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: #3D405B; margin: 0; font-size: 24px;">💛 Voces del Alma</h1>
      <p style="color: #3D405B; margin: 8px 0 0 0; opacity: 0.8;">Un espacio para respirar y sanar</p>
    </div>
    <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #F2CC8F;">
      ${contenido}
    </div>
    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
      © 2026 Voces del Alma · BIOZYNEX SAS - Todos los derechos reservados
    </p>
  </div>
`;
const enviarConfirmacionPago = async (params) => {
    const { email, nombre, fechaSesion, guiaNombre, monto, metodoPago } = params;
    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(v);
    const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">✅ ¡Pago confirmado!</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu pago ha sido procesado exitosamente. Tu sesión está confirmada y lista para comenzar.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #E07A5F;">
      <h3 style="color: #3D405B; margin-top: 0; font-size: 16px;">📋 Detalles de tu sesión</h3>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Fecha:</strong> ${fechaSesion}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Guía:</strong> ${guiaNombre}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Monto pagado:</strong> ${formatCurrency(monto)}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Método de pago:</strong> ${metodoPago}</p>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Recuerda conectarte a la plataforma a la hora acordada. Estamos aquí para acompañarte.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/inicio" 
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ir a mi sesión
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Cada paso, por pequeño que sea, cuenta."
    </p>
  `;
    return await enviarEmail({
        to: email,
        subject: '✅ Pago confirmado - Tu sesión está lista',
        html: templateBase(contenido)
    });
};
exports.enviarConfirmacionPago = enviarConfirmacionPago;
const enviarRecordatorio24h = async (params) => {
    const { email, nombre, fechaSesion, guiaNombre, requierePago } = params;
    const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">📅 Recuerda tu sesión de mañana</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Te recordamos que tienes una sesión agendada. Es un buen momento para reservar ese espacio para ti.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #E07A5F;">
      <h3 style="color: #3D405B; margin-top: 0; font-size: 16px;">📋 Detalles de tu sesión</h3>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Fecha:</strong> ${fechaSesion}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Guía:</strong> ${guiaNombre}</p>
    </div>

    ${requierePago ? `
      <div style="background-color: #FEF3C7; padding: 16px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #F59E0B;">
        <p style="color: #92400E; margin: 0; font-size: 14px;">
          ⚠️ <strong>Pago pendiente:</strong> recuerda realizar el pago al menos 1 hora antes del inicio.
          Si no lo realizas, la sesión se cancelará automáticamente y se aplicará una multa del 50%.
        </p>
      </div>
    ` : ''}

    <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
      <p style="color: #3D405B; margin: 0; font-size: 14px;">
        💡 <strong>Recuerda:</strong> si no puedes asistir, cancela con máximo 2 horas de anticipación para evitar una multa del 50% del valor de la sesión.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ver mi sesión
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Respirar también es avanzar."
    </p>
  `;
    return await enviarEmail({
        to: email,
        subject: '📅 Recuerda tu sesión de mañana',
        html: templateBase(contenido)
    });
};
exports.enviarRecordatorio24h = enviarRecordatorio24h;
const enviarRecordatorio2h = async (params) => {
    const { email, nombre, fechaSesion, guiaNombre, requierePago } = params;
    const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">⏰ Tu sesión es en 2 horas</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu sesión está por comenzar. Estamos listos para acompañarte.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #81B29A;">
      <h3 style="color: #3D405B; margin-top: 0; font-size: 16px;">📋 Detalles de tu sesión</h3>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Fecha:</strong> ${fechaSesion}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Guía:</strong> ${guiaNombre}</p>
    </div>

    ${requierePago ? `
      <div style="background-color: #FEE2E2; padding: 16px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #DC2626;">
        <p style="color: #991B1B; margin: 0; font-size: 14px;">
          🚨 <strong>Atención:</strong> aún no has realizado el pago. Debes pagar antes de 1 hora antes del inicio,
          de lo contrario la sesión se cancelará automáticamente y se aplicará una multa del 50%.
        </p>
      </div>
    ` : ''}

    <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
      <p style="color: #3D405B; margin: 0; font-size: 14px;">
        💡 <strong>Recuerda:</strong> si no puedes asistir, cancela ahora para evitar una multa del 50% del valor de la sesión.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ir a mi sesión
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Estamos aquí para acompañarte."
    </p>
  `;
    return await enviarEmail({
        to: email,
        subject: '⏰ Tu sesión es en 2 horas',
        html: templateBase(contenido)
    });
};
exports.enviarRecordatorio2h = enviarRecordatorio2h;
const enviarAgradecimientoDonacion = async (params) => {
    const { email, nombre, monto, mensaje } = params;
    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(v);
    const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">💝 ¡Gracias por tu donación!</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu generosidad hace posible que más personas encuentren un espacio seguro para sanar. 
      Gracias por confiar en nosotros.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center; border-left: 4px solid #81B29A;">
      <p style="color: #5D6078; margin: 0; font-size: 14px;">Tu donación</p>
      <p style="color: #E07A5F; margin: 8px 0 0 0; font-size: 32px; font-weight: bold;">
        ${formatCurrency(monto)}
      </p>
    </div>

    ${mensaje ? `
      <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
        <p style="color: #3D405B; margin: 0; font-style: italic;">"${mensaje}"</p>
        <p style="color: #888; margin: 8px 0 0 0; font-size: 12px; text-align: right;">— Tu mensaje</p>
      </div>
    ` : ''}

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Cada acto de bondad, por pequeño que sea, transforma el mundo."
    </p>
  `;
    return await enviarEmail({
        to: email,
        subject: '💝 ¡Gracias por tu donación!',
        html: templateBase(contenido)
    });
};
exports.enviarAgradecimientoDonacion = enviarAgradecimientoDonacion;
//# sourceMappingURL=emailService.js.map