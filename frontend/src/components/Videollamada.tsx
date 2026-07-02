import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC from 'agora-rtc-react';
import toast from 'react-hot-toast';
import { appId, getAgoraToken } from '../services/agoraService';
import { emergenciaService } from '../services/emergenciaService';
import { grabacionService } from '../services/grabacionService';

interface VideollamadaProps {
  channelName: string;
  onClose?: () => void;
  onEmergency?: () => void;
  tiempoTranscurrido?: number;
  tiempoRestante?: number;      
  duracionTotal?: number;       
}

const Videollamada: React.FC<VideollamadaProps> = ({ channelName, onClose, onEmergency, tiempoTranscurrido, tiempoRestante, duracionTotal }) => {
  const [loading, setLoading] = useState(true);
  const [hasRemote, setHasRemote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false); // <-- NUEVO
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null); // <-- NUEVO
  const clientRef = useRef<any>(null);
  const tracksRef = useRef<any[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const [mostrarConfirmacionEmergencia, setMostrarConfirmacionEmergencia] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [grabacionPendiente, setGrabacionPendiente] = useState(false);

  // ============================================
  // NUEVO: Funciones para pantalla completa
  // ============================================
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Escuchar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Funciones de control de audio/video
  const toggleMic = async () => {
    console.log('🎤 toggleMic - tracksRef.current[0]:', tracksRef.current[0]);
    console.log('🎤 toggleMic - micOn actual:', micOn);
    
    if (!tracksRef.current[0]) {
      console.log('❌ Track de audio no disponible');
      toast.error('El micrófono no está listo aún. Espera unos segundos.');
      return;
    }
    
    try {
      await tracksRef.current[0].setEnabled(!micOn);
      setMicOn(!micOn);
      console.log('🎤 Micrófono ahora:', !micOn ? 'ON' : 'OFF');
      toast.success(`Micrófono ${!micOn ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error al cambiar micrófono:', error);
      toast.error('No se pudo cambiar el estado del micrófono');
    }
  };

const toggleCamera = async () => {
  console.log('📹 toggleCamera - tracksRef.current[1]:', tracksRef.current[1]);
  console.log('📹 toggleCamera - cameraOn actual:', cameraOn);
  
  if (!tracksRef.current[1]) {
    console.log('❌ Track de video no disponible');
    toast.error('La cámara no está lista aún. Espera unos segundos.');
    return;
  }
  
  try {
    await tracksRef.current[1].setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
    console.log('📹 Cámara ahora:', !cameraOn ? 'ON' : 'OFF');
    toast.success(`Cámara ${!cameraOn ? 'activada' : 'desactivada'}`);
  } catch (error) {
    console.error('Error al cambiar cámara:', error);
    toast.error('No se pudo cambiar el estado de la cámara');
  }
};

  // Función de emergencia
  const handleEmergencia = async () => {
    try {
      await emergenciaService.activarEmergencia(channelName, 'Emergencia durante videollamada');
      
      toast.error('🚨 EMERGENCIA ACTIVADA', {
        duration: 0,
        icon: '🚨',
        style: {
          background: '#dc2626',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '16px',
        }
      });

      toast('Se ha notificado al equipo de soporte', {
        duration: 6000,
        icon: '📢',
        style: {
          background: '#1f2937',
          color: 'white',
        }
      });

      setMostrarConfirmacionEmergencia(false);
    } catch (error) {
      console.error('Error al activar emergencia:', error);
      toast.error('Error al activar emergencia');
    }
  };



  // Función de grabación
  const handleSolicitarGrabacion = async () => {
    try {
      await grabacionService.solicitarGrabacion(channelName);
      setGrabacionPendiente(true);
      toast.success('Solicitud de grabación enviada', {
        icon: '📹',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al solicitar grabación:', error);
      toast.error('Error al solicitar grabación');
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log('🎥 Iniciando videollamada en canal:', channelName);
        
        // Inicializar cliente
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Obtener token
        const token = await getAgoraToken(channelName);
        if (!token) throw new Error('No se pudo obtener token');

        // Unirse al canal
        await client.join(appId, channelName, token, null);
        console.log('✅ Unido al canal');

        // Crear tracks locales
        console.log('🎥 Solicitando acceso a cámara y micrófono...');
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack().catch(err => {
          console.error('Error al crear audio track:', err);
          throw err;
        });

        const videoTrack = await AgoraRTC.createCameraVideoTrack().catch(err => {
          console.error('Error al crear video track:', err);
          throw err;
        });

        console.log('✅ Tracks creados:', { audio: !!audioTrack, video: !!videoTrack });
        tracksRef.current = [audioTrack, videoTrack];

        // Publicar tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('✅ Tracks publicados');

        // Reproducir video local - con timeout para asegurar que el DOM esté listo
        setTimeout(() => {
          if (localVideoRef.current && mounted) {
            console.log('🎬 Reproduciendo video local en:', localVideoRef.current);
            videoTrack.play(localVideoRef.current);
          } else {
            console.log('❌ localVideoRef no disponible');
          }
        }, 500);

        // Manejar usuarios remotos
        client.on('user-published', async (user, mediaType) => {
          if (!mounted) return;
          
          console.log('📡 Usuario publicado:', user.uid, mediaType);
          
          try {
            await client.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
              if (remoteVideoRef.current && mounted) {
                user.videoTrack?.play(remoteVideoRef.current);
                setHasRemote(true);
              }
            }
            
            if (mediaType === 'audio') {
              user.audioTrack?.play();
            }

            // Evitar notificaciones duplicadas
            if (!notifiedRef.current.has(String(user.uid))) {
              notifiedRef.current.add(String(user.uid));
              toast.success('👤 Participante conectado', {
                id: `user-${String(user.uid)}`,
                duration: 3000
              });
            }
          } catch (err) {
            console.error('Error al suscribirse:', err);
          }
        });

        client.on('user-left', (user) => {
          console.log('👋 Usuario desconectado:', user.uid);
          notifiedRef.current.delete(String(user.uid));
          setHasRemote(false);
        });

        client.on('connection-state-change', (curState) => {
          console.log('📡 Estado conexión:', curState);
          if (curState === 'DISCONNECTED' && mounted) {
            setError('Conexión perdida');
          }
        });

        if (mounted) {
          setLoading(false);
          setError(null);
        }

      } catch (err) {
        console.error('❌ Error en videollamada:', err);
        if (mounted) {
          if (err instanceof Error && err.name === 'NOT_READABLE') {
            setError('No se puede acceder a la cámara/micrófono. Asegúrate de que no estén siendo usados por otra aplicación.');
          } else {
            setError(err instanceof Error ? err.message : 'Error al conectar');
          }
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      console.log('🧹 Limpiando videollamada');
      
      // Limpiar tracks
      tracksRef.current.forEach(track => {
        track.close();
      });
      
      // Salir del canal
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, [channelName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <p className="text-gray-400">Conectando a la videollamada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-center">
          <p className="text-red-400 mb-2">❌ {error}</p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={videoContainerRef}
      className={`bg-gray-900 rounded-lg p-4 transition-all ${
        isFullscreen ? 'fullscreen-video' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Videollamada</h3>
        <div className="flex gap-2">
          {/* Botón de emergencia con confirmación */}
          {mostrarConfirmacionEmergencia ? (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
                <h3 className="text-red-500 text-2xl font-bold mb-4">🚨 ACTIVAR EMERGENCIA</h3>
                <p className="text-white mb-6">
                  ¿Estás seguro? Esto notificará inmediatamente al otro participante y a los administradores.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleEmergencia}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold"
                  >
                    SÍ, ACTIVAR
                  </button>
                  <button
                    onClick={() => setMostrarConfirmacionEmergencia(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setMostrarConfirmacionEmergencia(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <span>🚨</span> Emergencia
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Temporizador de sesión */}
      {tiempoTranscurrido !== undefined && tiempoRestante !== undefined && (
        <div className="bg-blue-900/50 p-2 rounded-lg mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-blue-300 font-medium">Tiempo de sesión</p>
              <p className="text-base font-bold text-blue-400">
                {Math.floor(tiempoTranscurrido / 60)}:{(tiempoTranscurrido % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-orange-300 font-medium">Tiempo restante</p>
              <p className="text-base font-bold text-orange-400">
                {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(tiempoTranscurrido / ((duracionTotal || 60) * 60)) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Controles de audio/video y grabación */}
      <div className="bg-gray-800 px-4 py-2 flex gap-2 flex-wrap mb-4">
        <button
          onClick={toggleMic}
          className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
            micOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {micOn ? '🎤 Micrófono On' : '🔇 Micrófono Off'}
        </button>
        <button
          onClick={toggleCamera}
          className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
            cameraOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {cameraOn ? '📹 Cámara On' : '🚫 Cámara Off'}
        </button>

        {/* Botones de grabación */}
        {!grabando && !grabacionPendiente && (
          <button
            onClick={handleSolicitarGrabacion}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
          >
            <span>📹</span> Solicitar grabación
          </button>
        )}
        
        {grabacionPendiente && (
          <span className="text-yellow-400 text-sm flex items-center gap-1 px-3 py-1">
            <span>⏳</span> Esperando confirmación...
          </span>
        )}
        
        {grabando && (
          <span className="text-red-500 text-sm flex items-center gap-1 px-3 py-1 animate-pulse">
            <span>🔴</span> GRABANDO
          </span>
        )}

        {/* ============================================ */}
        {/* NUEVO: Botón de pantalla completa */}
        {/* ============================================ */}
        <button
          onClick={toggleFullscreen}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
        >
          {isFullscreen ? '⤬' : '⤢'} {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video local */}
        <div className="relative">
          <div 
            ref={localVideoRef}
            className="aspect-video bg-gray-800 rounded-lg"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Tú {!micOn && '🔇'} {!cameraOn && '🚫'}
          </div>
        </div>

        {/* Video remoto */}
        <div className="relative">
          {hasRemote ? (
            <div 
              ref={remoteVideoRef}
              className="aspect-video bg-gray-800 rounded-lg"
            />
          ) : (
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center p-4">
              <p className="text-gray-400 text-center">
                Esperando a que el otro participante se conecte...
                <br />
                <span className="text-sm">(El otro usuario debe iniciar la videollamada)</span>
              </p>
            </div>
          )}
          {hasRemote && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              Participante
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Videollamada;