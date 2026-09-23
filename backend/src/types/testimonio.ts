// src/types/testimonio.ts

export type EstadoTestimonio = 'pendiente' | 'aprobado' | 'rechazado';

export interface Testimonio {
  id: number;
  usuario_id: string;          // UUID
  titulo: string;
  contenido: string;
  calificacion: number;
  edad: number | null;
  ciudad: string | null;
  estado: EstadoTestimonio;
  motivo_rechazo: string | null;
  destacado: boolean;
  moderado_por: string | null; // UUID
  moderado_en: Date | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface TestimonioPublico {
  id: number;
  titulo: string;
  contenido: string;
  calificacion: number;
  edad: number | null;
  ciudad: string | null;
  destacado: boolean;
  creado_en: Date;
  autor: string;
  es_anonimo: boolean;
}