// Zona horaria por defecto del proyecto.
// Cuando abramos a otros países, esta constante se reemplazará por la zona
// guardada en cada turno (o la del navegador del usuario, según decida el producto).
export const ZONA_HORARIA_DEFECTO = 'America/Bogota';

/**
 * Formatea una fecha a hora local (HH:mm).
 * Ej: "02:50 p. m."
 */
export const formatearHora = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA_HORARIA_DEFECTO
  });
};

/**
 * Formatea una fecha a fecha completa con hora.
 * Ej: "25/09/2026, 02:50 p. m."
 */
export const formatearFechaHora = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleString('es-CO', {
    timeZone: ZONA_HORARIA_DEFECTO
  });
};

/**
 * Formatea una fecha a solo fecha (sin hora).
 * Ej: "25/09/2026"
 */
export const formatearFecha = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleDateString('es-CO', {
    timeZone: ZONA_HORARIA_DEFECTO
  });
};

/**
 * Formatea una fecha a fecha larga legible.
 * Ej: "25 de septiembre de 2026, 2:50 p. m."
 */
export const formatearFechaLarga = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA_HORARIA_DEFECTO
  });
};