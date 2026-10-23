import React, { useState, useEffect, useRef } from 'react';
import { aiService, MensajeIA } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatearHora } from '../utils/fechaHora';

const ChatIA: React.FC = () => {
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState<MensajeIA[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar historial inicial
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        const data = await aiService.obtenerHistorial();
        setMensajes(data);
        setTimeout(() => {
          mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      } catch (error) {
        console.error('Error al cargar historial:', error);
        toast.error('No se pudo cargar el historial de Alma');
      } finally {
        setLoading(false);
      }
    };
    cargarHistorial();
  }, []);

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, enviando]);

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || enviando) return;

    const texto = nuevoMensaje.trim();
    setNuevoMensaje('');
    setEnviando(true);

    // 1. Agregar el mensaje del usuario a la vista de inmediato (Optimistic UI)
    const mensajeOptimista: MensajeIA = {
      id: 'temp-' + Date.now(),
      rol: 'user',
      contenido: texto,
      created_at: new Date().toISOString()
    };
    setMensajes(prev => [...prev, mensajeOptimista]);

    try {
      // 2. Enviar a la IA
      const respuestaIA = await aiService.enviarMensaje(texto);

      // 3. Agregar la respuesta de Alma
      const mensajeAlma: MensajeIA = {
        id: 'temp-ia-' + Date.now(),
        rol: 'assistant',
        contenido: respuestaIA,
        created_at: new Date().toISOString()
      };
      
      // Reemplazamos el mensaje optimista por el real y agregamos el de Alma
      setMensajes(prev => {
        const sinOptimista = prev.filter(m => m.id !== mensajeOptimista.id);
        return [
          ...sinOptimista, 
          { ...mensajeOptimista, id: 'real-' + Date.now() }, 
          mensajeAlma
        ];
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Alma no pudo responder en este momento. Intenta de nuevo.');
      // Removemos el mensaje optimista si falló
      setMensajes(prev => prev.filter(m => m.id !== mensajeOptimista.id));
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const formatHora = (fecha: string) => {
    try {
      return formatearHora(fecha);
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">💙</div>
          <p className="text-gray-500">Conectando con Alma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header del chat */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-[#F2CC8F]/40 to-[#E07A5F]/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">
            ✨
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#3D405B]">Alma</h3>
            <p className="text-xs text-[#5D6078] flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Guía de IA disponible 24/7
            </p>
          </div>
        </div>
      </div>
      
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FDF6EC]/50">
        {mensajes.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[#5D6078] font-medium mb-1">Hola {user?.nombre?.split(' ')[0] || 'amig@'}, soy Alma.</p>
            <p className="text-sm text-gray-500">Estoy aquí para escucharte sin juzgar. ¿Cómo te sientes hoy?</p>
          </div>
        ) : (
          mensajes.map((mensaje) => {
            const esMio = mensaje.rol === 'user';
            return (
              <div
                key={mensaje.id}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    esMio
                      ? 'bg-[#3D405B] text-white rounded-br-none'
                      : 'bg-white border border-[#F2CC8F]/30 text-[#3D405B] rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{mensaje.contenido}</p>
                  <div className={`text-[10px] mt-1 flex justify-end ${
                    esMio ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {formatHora(mensaje.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Indicador de "Alma está escribiendo..." */}
        {enviando && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#F2CC8F]/30 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Alma está pensando</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleEnviarMensaje} className="border-t p-4 bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escríbele a Alma..."
            className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50 text-sm text-[#3D405B]"
            disabled={enviando}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={enviando || !nuevoMensaje.trim()}
            className="bg-[#E07A5F] text-white px-6 py-3 rounded-full hover:bg-[#d16a4f] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatIA;