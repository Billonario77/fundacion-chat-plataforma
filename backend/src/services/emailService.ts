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
      <h1 style="color: #3D405B; margin: 0; font-size: 24px;">💛 Voces del Alma</h1>
      <p style="color: #3D405B; margin: 8px 0 0 0; opacity: 0.8;">Un espacio para hablar y sanar</p>
    </div>
    <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #F2CC8F;">
      ${contenido}
    </div>
    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
      © 2026 Voces del Alma · una marca Biozynex SAS - Todos los derechos reservados
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
// RECORDATORIO 24 HORAS ANTES
// ============================================
export const enviarRecordatorio24h = async (params: {
  email: string;
  nombre: string;
  fechaSesion: string;
  guiaNombre: string;
  requierePago: boolean;
}): Promise<boolean> => {
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

// ============================================
// RECORDATORIO 2 HORAS ANTES
// ============================================
export const enviarRecordatorio2h = async (params: {
  email: string;
  nombre: string;
  fechaSesion: string;
  guiaNombre: string;
  requierePago: boolean;
}): Promise<boolean> => {
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


// ============================================
// TESTIMONIO APROBADO
// ============================================
export const enviarTestimonioAprobado = async (params: {
  email: string;
  nombre: string;
  titulo: string;
}): Promise<boolean> => {
  const { email, nombre, titulo } = params;

  const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">💬 ¡Tu testimonio fue aprobado!</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu historia fue revisada y aprobada. Ya está publicada en nuestra página de testimonios
      y muy pronto otras personas podrán leerla y sentirse inspiradas por tu valentía.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #81B29A;">
      <p style="color: #5D6078; margin: 0; font-size: 14px;">Tu testimonio</p>
      <p style="color: #3D405B; margin: 8px 0 0 0; font-size: 16px; font-style: italic;">"${titulo}"</p>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Gracias por compartir tu voz. Tu historia puede ser el primer paso que otra persona necesita dar.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/testimonios"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ver testimonios
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Tu voz también sana."
    </p>
  `;

  return await enviarEmail({
    to: email,
    subject: '💬 ¡Tu testimonio fue aprobado!',
    html: templateBase(contenido)
  });
};

// ============================================
// TESTIMONIO RECHAZADO
// ============================================
export const enviarTestimonioRechazado = async (params: {
  email: string;
  nombre: string;
  titulo: string;
  motivo: string;
}): Promise<boolean> => {
  const { email, nombre, titulo, motivo } = params;

  const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">📝 Sobre tu testimonio</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Gracias por tomarte el tiempo de compartir tu historia. Tu testimonio fue revisado por nuestro equipo,
      y en esta ocasión no pudimos publicarlo.
    </p>

    <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
      <p style="color: #5D6078; margin: 0 0 8px 0; font-size: 14px;">Testimonio:</p>
      <p style="color: #3D405B; margin: 0; font-size: 15px; font-style: italic;">"${titulo}"</p>
    </div>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #E07A5F;">
      <p style="color: #5D6078; margin: 0 0 8px 0; font-size: 14px;"><strong>Motivo del rechazo:</strong></p>
      <p style="color: #3D405B; margin: 0; font-size: 15px;">${motivo}</p>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Si lo deseas, puedes editarlo y enviarlo de nuevo desde tu panel. Estamos aquí para escucharte.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Editar mi testimonio
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Toda historia merece ser contada, a su manera."
    </p>
  `;

  return await enviarEmail({
    to: email,
    subject: '📝 Sobre tu testimonio enviado',
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
// BIENVENIDA A PLAN DE SUSCRIPCIÓN
// ============================================
export const enviarBienvenidaSuscripcion = async (params: {
  email: string;
  nombre: string;
  plan: 'bienestar' | 'refugio' | 'santuario';
  sesionesIncluidas: number;
  precioPagado: number;
  fechaFin: string;
}): Promise<boolean> => {
  const { email, nombre, plan, sesionesIncluidas, precioPagado, fechaFin } = params;

  const nombresPlan: Record<string, string> = {
    bienestar: '💎 Bienestar',
    refugio: '🌟 Refugio',
    santuario: '👑 Santuario',
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(v);

  const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">🎉 ¡Tu plan está activo!</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu plan <strong>${nombresPlan[plan]}</strong> ha sido activado exitosamente.
      Ahora disfrutas de beneficios exclusivos pensados para tu bienestar.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #E07A5F;">
      <h3 style="color: #3D405B; margin-top: 0; font-size: 16px;">📋 Detalles de tu plan</h3>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Plan:</strong> ${nombresPlan[plan]}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Sesiones incluidas:</strong> ${sesionesIncluidas}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Vigencia hasta:</strong> ${fechaFin}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Total pagado:</strong> ${formatCurrency(precioPagado)}</p>
    </div>

    <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
      <p style="color: #3D405B; margin: 0 0 8px 0; font-size: 14px;"><strong>✨ Beneficios de tu plan:</strong></p>
      <ul style="color: #3D405B; margin: 0; padding-left: 20px; font-size: 14px;">
        <li>${sesionesIncluidas} sesiones por período de 30 días</li>
        <li>Sin Tarifa por Prioridad, aunque agendes con menos de 2 horas</li>
        <li>Agenda con solo 30 minutos de anticipación</li>
      </ul>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Ya puedes agendar tus sesiones desde tu panel. Cuando se agoten, podrás renovar tu plan
      o pagar sesiones adicionales a tarifa normal.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ir a mi panel
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Invertir en ti es el mejor regalo que puedes darte."
    </p>
  `;

  return await enviarEmail({
    to: email,
    subject: '🎉 Tu plan está activo - Voces del Alma',
    html: templateBase(contenido),
  });
};

// ============================================
// RECORDATORIO DE VENCIMIENTO PRÓXIMO (3 días antes)
// ============================================
export const enviarRecordatorioVencimientoSuscripcion = async (params: {
  email: string;
  nombre: string;
  plan: 'bienestar' | 'refugio' | 'santuario';
  sesionesRestantes: number;
  fechaFin: string;
  diasRestantes: number;
}): Promise<boolean> => {
  const { email, nombre, plan, sesionesRestantes, fechaFin, diasRestantes } = params;

  const nombresPlan: Record<string, string> = {
    bienestar: '💎 Bienestar',
    refugio: '🌟 Refugio',
    santuario: '👑 Santuario',
  };

  const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">⏳ Tu plan está por vencer</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Te recordamos que tu plan <strong>${nombresPlan[plan]}</strong> vence en
      <strong>${diasRestantes} día${diasRestantes === 1 ? '' : 's'}</strong>.
    </p>

    <div style="background-color: #FDF6EC; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #F59E0B;">
      <h3 style="color: #3D405B; margin-top: 0; font-size: 16px;">📋 Estado de tu plan</h3>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Plan:</strong> ${nombresPlan[plan]}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Sesiones restantes:</strong> ${sesionesRestantes}</p>
      <p style="color: #5D6078; margin: 8px 0;"><strong>Fecha de vencimiento:</strong> ${fechaFin}</p>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Renueva ahora para seguir disfrutando de tus beneficios: sin Tarifa por Prioridad y
      con mayor flexibilidad para agendar.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Renovar mi plan
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Cuidarte es un acto de amor propio."
    </p>
  `;

  return await enviarEmail({
    to: email,
    subject: `⏳ Tu plan vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`,
    html: templateBase(contenido),
  });
};

// ============================================
// AVISO DE VENCIMIENTO
// ============================================
export const enviarVencimientoSuscripcion = async (params: {
  email: string;
  nombre: string;
  plan: 'bienestar' | 'refugio' | 'santuario';
}): Promise<boolean> => {
  const { email, nombre, plan } = params;

  const nombresPlan: Record<string, string> = {
    bienestar: '💎 Bienestar',
    refugio: '🌟 Refugio',
    santuario: '👑 Santuario',
  };

  const contenido = `
    <h2 style="color: #3D405B; margin-top: 0;">📅 Tu plan ha vencido</h2>
    <p style="color: #5D6078; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p style="color: #5D6078; font-size: 16px;">
      Tu plan <strong>${nombresPlan[plan]}</strong> ha llegado a su fecha de vencimiento.
      Ya no está activo, pero puedes renovarlo cuando quieras.
    </p>

    <div style="background-color: #F4E8D8; padding: 16px; border-radius: 12px; margin: 24px 0;">
      <p style="color: #3D405B; margin: 0; font-size: 14px;">
        💡 <strong>Recuerda:</strong> mientras no tengas un plan activo, agendar con menos de 2 horas
        de anticipación aplicará la Tarifa por Prioridad del 50%. También el mínimo de anticipación
        vuelve a ser de 30 minutos.
      </p>
    </div>

    <p style="color: #5D6078; font-size: 16px;">
      Si deseas seguir disfrutando de los beneficios, renueva tu plan desde tu panel.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://fundacion-chat-frontend-api.netlify.app/usuario"
         style="background-color: #E07A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">
        Ver planes disponibles
      </a>
    </div>

    <p style="color: #5D6078; font-size: 14px; text-align: center; font-style: italic; margin-top: 32px;">
      "Cada proceso tiene su ritmo. Aquí estaremos cuando quieras volver."
    </p>
  `;

  return await enviarEmail({
    to: email,
    subject: '📅 Tu plan ha vencido - Voces del Alma',
    html: templateBase(contenido),
  });
};

// ============================================
// EXPORTAR EL TRANSPORTER PARA USO EXTERNO
// ============================================
export { enviarEmail };