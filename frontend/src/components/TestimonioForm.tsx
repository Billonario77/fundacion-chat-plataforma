import React, { useState } from 'react';
import StarRating from './StarRating';
import { testimoniosService } from '../services/testimoniosService';

interface Props {
  onCreated?: () => void;
  testimonioExistente?: {
    id: number;
    titulo: string;
    contenido: string;
    calificacion: number;
    edad: number | null;
    ciudad: string | null;
  } | null;
}

export default function TestimonioForm({ onCreated, testimonioExistente }: Props) {
  const [titulo, setTitulo] = useState(testimonioExistente?.titulo ?? '');
  const [contenido, setContenido] = useState(testimonioExistente?.contenido ?? '');
  const [calificacion, setCalificacion] = useState(testimonioExistente?.calificacion ?? 5);
  const [edad, setEdad] = useState<string>(
    testimonioExistente?.edad != null ? String(testimonioExistente.edad) : ''
  );
  const [ciudad, setCiudad] = useState(testimonioExistente?.ciudad ?? '');

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    const edadNum = edad.trim() === '' ? null : Number(edad);

    const payload = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      calificacion,
      edad: edadNum,
      ciudad: ciudad.trim() || null,
    };

    try {
      if (testimonioExistente) {
        await testimoniosService.editar(testimonioExistente.id, payload);
        setMensaje({ tipo: 'ok', texto: 'Testimonio actualizado y reenviado a revisión ✨' });
      } else {
        await testimoniosService.crear(payload);
        setMensaje({ tipo: 'ok', texto: '¡Gracias! Tu testimonio será revisado por el equipo.' });
        setTitulo('');
        setContenido('');
        setCalificacion(5);
        setEdad('');
        setCiudad('');
      }
      onCreated?.();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.error ?? 'No se pudo enviar el testimonio',
      });
    } finally {
      setEnviando(false);
    }
  };

  const restantes = 1000 - contenido.length;
  const puedeEnviar =
    titulo.trim().length >= 5 && contenido.trim().length >= 20;

  return (
    <form
      onSubmit={enviar}
      className="rounded-3xl bg-white/70 backdrop-blur-sm border border-[#E07A5F]/20 p-6 shadow-sm space-y-4"
    >
      <h3 className="font-serif text-xl text-[#3D405B]">
        {testimonioExistente ? 'Editar mi testimonio' : 'Comparte tu experiencia'}
      </h3>

      <div>
        <label className="text-sm text-[#3D405B]/70 mb-1 block">
          Un título que resuma tu historia
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value.slice(0, 150))}
          placeholder="Ej: Encontré un lugar donde no me sentí juzgada"
          className="w-full rounded-2xl border border-[#3D405B]/15 bg-[#FDF6EC]/60 p-3 text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
          required
          minLength={5}
          maxLength={150}
        />
        <div className="text-xs text-right text-[#3D405B]/50 mt-1">
          {150 - titulo.length} caracteres restantes
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-[#3D405B]/70 mb-1 block">
            Edad <span className="text-[#3D405B]/40">(opcional)</span>
          </label>
          <input
            type="number"
            min={13}
            max={120}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Ej: 34"
            className="w-full rounded-2xl border border-[#3D405B]/15 bg-[#FDF6EC]/60 p-3 text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
          />
        </div>

        <div>
          <label className="text-sm text-[#3D405B]/70 mb-1 block">
            Ciudad <span className="text-[#3D405B]/40">(opcional)</span>
          </label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value.slice(0, 100))}
            placeholder="Ej: Bogotá"
            className="w-full rounded-2xl border border-[#3D405B]/15 bg-[#FDF6EC]/60 p-3 text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-[#3D405B]/70 mb-1 block">
          ¿Cómo calificarías tu experiencia?
        </label>
        <StarRating value={calificacion} onChange={setCalificacion} size="lg" />
      </div>

      <div>
        <label className="text-sm text-[#3D405B]/70 mb-1 block">Tu testimonio</label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value.slice(0, 1000))}
          rows={5}
          placeholder="Cuéntanos cómo te ha ayudado la fundación…"
          className="w-full rounded-2xl border border-[#3D405B]/15 bg-[#FDF6EC]/60 p-4 text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50 resize-none"
          required
          minLength={20}
        />
        <div className="text-xs text-right text-[#3D405B]/50 mt-1">
          {restantes} caracteres restantes
        </div>
      </div>

      {mensaje && (
        <p
          className={`text-sm rounded-xl px-3 py-2 ${
            mensaje.tipo === 'ok'
              ? 'bg-[#81B29A]/15 text-[#3D405B]'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !puedeEnviar}
        className="rounded-full bg-[#E07A5F] hover:bg-[#E07A5F]/90 disabled:opacity-50 text-white px-6 py-3 font-medium transition shadow-sm"
      >
        {enviando ? 'Enviando…' : testimonioExistente ? 'Guardar cambios' : 'Enviar testimonio'}
      </button>
    </form>
  );
}