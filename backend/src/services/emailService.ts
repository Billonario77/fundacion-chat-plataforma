import * as nodemailer from 'nodemailer';

// ============================================
// CONFIGURACIÓN DEL TRANSPORTER
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================
// FUNCIÓN GENÉRICA PARA ENVIAR EMAILS
// ============================================
const enviarEmail = async (opciones: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: opciones.to,
      subject: opciones.subject,
      html: opciones.html,
    });
    console.log(`📧 Email enviado a: ${opciones.to} - Asunto: ${opciones.subject}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return false;
  }
};

// ============================================
// TEMPLATE BASE (estilo Fundación Apoyo)
// ============================================
const templateBase = (contenido: string) => `
  <div style="font-family: 'Georgia', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FDF6EC;">
    <div style="background: linear-gradient(135deg, #F2CC8F 0%, #E07A5F 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: #3D405B; margin: 0; font-size: 24px;">💛 Fundación Apoyo</h1>
      <p style="color: #3D405B; margin: 8px 0 0 0; opacity: 0.8;">Un espacio para respirar y sanar</p>
    </div>
    <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #F2CC8F;">
      ${contenido}
    </div>
    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
      © 2026 Fundación Apoyo - Todos los derechos reservados
    </p>
  </div>
`;

// ============================================
// CONFIRMACIÓN DE PAGO DE SESIÓN
// ============================================
export const enviarConfirmacionPago = async (params: {
  email: string;
  nombre: string;
  fechaSesion: string;
  guiaNombre: string;
  monto: number;
  metodoPago: string;
}): Promise<boolean> => {
  const { email, nombre, fechaSesion, guiaNombre, monto, metodoPago } = params;

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('es-CO', {
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

// ============================================
// AGRADECIMIENTO POR DONACIÓN
// ============================================
export const enviarAgradecimientoDonacion = async (params: {
  email: string;
  nombre: string;
  monto: number;
  mensaje?: string;
}): Promise<boolean> => {
  const { email, nombre, monto, mensaje } = params;

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('es-CO', {
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

// ============================================
// EXPORTAR EL TRANSPORTER PARA USO EXTERNO
// ============================================
export { enviarEmail };