import React, { useState, useEffect, useRef } from 'react';
import { aiService, MensajeIA } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatearHora } from '../utils/fechaHora';

interface ChatIAProps {
  onClose: () => void;
}

const ChatIA: React.FC<ChatIAProps> = ({ onClose }) => {
  const { user } = useAuth();
  const isLogged = !!user; // Si hay usuario, está logueado

  const [mensajes, setMensajes] = useState<MensajeIA[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(isLogged); // Solo carga si está logueado
  const [enviando, setEnviando] = useState(false);
  
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar historial inicial (solo si está logueado)
  useEffect(() => {
    if (!isLogged) return;

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
  }, [isLogged]);

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
      let respuestaIA = '';

      if (isLogged) {
        // Usuario logueado
        respuestaIA = await aiService.enviarMensaje(texto);
      } else {
        // Usuario público (invitado)
        // Mandamos el historial actual + el mensaje nuevo a la API pública
        const historialParaAPI = mensajes.map(m => ({ rol: m.rol, contenido: m.contenido }));
        historialParaAPI.push({ rol: 'user', contenido: texto });
        respuestaIA = await aiService.enviarMensajePublico(historialParaAPI);
      }

      // 3. Agregar la respuesta de Alma
      const mensajeAlma: MensajeIA = {
        id: 'temp-ia-' + Date.now(),
        rol: 'assistant',
        contenido: respuestaIA,
        created_at: new Date().toISOString()
      };
      
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
      <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">💙</div>
          <p className="text-gray-500 text-sm">Conectando con Alma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header del chat */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-[#F2CC8F]/40 to-[#E07A5F]/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm">
            ✨
          </div>
          <div>
            <h3 className="font-serif font-bold text-[#3D405B] leading-tight">Alma</h3>
            <p className="text-[10px] text-[#5D6078] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              En línea
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 bg-white/50 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDF6EC]/50">
        {mensajes.length === 0 ? (
          <div className="text-center mt-6">
            <p className="text-[#5D6078] font-medium mb-1">Hola {isLogged ? user?.nombre?.split(' ')[0] : 'amig@'}, soy Alma.</p>
            <p className="text-xs text-gray-500 leading-relaxed">Estoy aquí para escucharte sin juzgar. ¿Cómo te sientes hoy?</p>
          </div>
        ) : (
          mensajes.map((mensaje) => {
            const esMio = mensaje.rol === 'user';
            return (
              <div key={mensaje.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                    esMio
                      ? 'bg-[#3D405B] text-white rounded-br-none'
                      : 'bg-white border border-[#F2CC8F]/30 text-[#3D405B] rounded-bl-none'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{mensaje.contenido}</p>
                  <div className={`text-[9px] mt-1 flex justify-end ${esMio ? 'text-gray-300' : 'text-gray-400'}`}>
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
            <div className="bg-white border border-[#F2CC8F]/30 rounded-2xl px-3 py-2 rounded-bl-none shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">Alma está pensando</span>
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-[#81B29A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleEnviarMensaje} className="p-3 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escríbele a Alma..."
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50 text-xs text-[#3D405B]"
            disabled={enviando}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={enviando || !nuevoMensaje.trim()}
            className="bg-[#E07A5F] text-white px-4 py-2 rounded-full hover:bg-[#d16a4f] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs shadow-md"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatIA;