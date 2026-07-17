import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMensajesNoLeidos } from '../contexts/MensajesNoLeidosContext';
import toast from 'react-hot-toast';
import { usuarioService, Turno, turnosService } from '../services/turnosService';
import { reprogramacionService, Reprogramacion } from '../services/reprogramacionService';
import HistorialTurnos from '../components/HistorialTurnos';
import Layout from '../components/Layout';
import ModalCancelarTurno from '../components/ModalCancelarTurno';
import CompletarDatos from '../components/CompletarDatos';
import Avatar from '../components/Avatar';


const UsuarioDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { noLeidos, recargarNoLeidos } = useMensajesNoLeidos();
  console.log('👤 Usuario ID en dashboard:', user?.id);
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Turno[]>([]);
  const [reprogramaciones, setReprogramaciones] = useState<Reprogramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepro, setLoadingRepro] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pestañaActiva, setPestañaActiva] = useState<'activas' | 'historial' | 'reprogramaciones' | 'cancelados'>('activas');
  const [ultimoEvento, setUltimoEvento] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
    
  // ============================================
  // Estado para modal de cancelación
  // ============================================
  const [modalCancelar, setModalCancelar] = useState<{ 
    abierto: boolean; 
    turnoId: string | null 
  }>({
    abierto: false,
    turnoId: null
  });

  // Estados para reprogramación
  const [turnoAReprogramar, setTurnoAReprogramar] = useState<Turno | null>(null);
  const [preferencia, setPreferencia] = useState<'mismo_guia' | 'otro_guia' | 'cambiar_fecha'>('otro_guia');
  const [fechaPreferida, setFechaPreferida] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [reprogramando, setReprogramando] = useState(false);

  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    rol: 'apoyo' as 'crisis' | 'apoyo' | 'seguimiento',
    mensaje: '',
    fecha_preferida: ''
  });

const [miFoto, setMiFoto] = useState<string | null>(null);
const [mostrarCompletarDatos, setMostrarCompletarDatos] = useState(false);
const [datosCompletados, setDatosCompletados] = useState(true);
const [modalCerrado, setModalCerrado] = useState(false);

  // ============================================
  // DETERMINAR GUÍA ORIGINAL Y ACTUAL
  // ============================================
  const usuarioGuiaOriginal = solicitudes.length > 0 
    ? solicitudes.reduce((oldest, current) => 
        new Date(oldest.created_at) < new Date(current.created_at) ? oldest : current
      ).guia_nombre 
    : null;

  const solicitudActivaMasReciente = solicitudes
    .filter(s => ['pendiente', 'aceptado', 'iniciado'].includes(s.estado))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const usuarioGuiaActual = solicitudActivaMasReciente?.guia_nombre;
  const usuarioTieneGuiaOriginal = !!usuarioGuiaOriginal;
  const usuarioTieneGuiaActual = !!usuarioGuiaActual;
  const usuarioGuiaCambio = usuarioTieneGuiaOriginal && usuarioTieneGuiaActual && usuarioGuiaOriginal !== usuarioGuiaActual;

  // ============================================
  // FUNCIÓN PARA VOLVER AL GUÍA ORIGINAL
  // ============================================
  const handleVolverGuiaOriginal = async () => {
    try {
      if (!reprogramacionService.solicitarCambioGuia) {
        console.error('Error: reprogramacionService.solicitarCambioGuia no está definido');
        toast.error('Error en la configuración. Contacta al administrador.');
        return;
      }
      
      await reprogramacionService.solicitarCambioGuia('mismo_guia');
      toast.success('Solicitud enviada. Volverás a tu guía original en tu próxima solicitud.', {
        duration: 5000,
        icon: '🔄'
      });
    } catch (error) {
      console.error('Error al solicitar volver al guía original:', error);
      toast.error('Error al enviar la solicitud');
    }
  };

  // ============================================
  // FUNCIÓN PARA CANCELAR TURNO
  // ============================================
  const handleCancelarTurno = async (turnoId: string, motivo: string) => {
    try {
      const response = await turnosService.cancelarTurno(turnoId, motivo);
      toast.success('Turno cancelado exitosamente');
      
      if (response.requierePenalizacion) {
        toast('El valor del costo de cancelación será adicionado a su siguiente solicitud.', {
          icon: '⚠️',
          duration: 6000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
          }
        });
      }
      
      await cargarSolicitudes();
      await cargarReprogramaciones();
      
    // Al recibir nueva cancelación, contar nuevas
    setTimeout(async () => {
      try {
        const result = await turnosService.contarCancelacionesNoVistas();
        setNuevasCancelacionesCount(result.count);
      } catch (error) {
        console.error('Error al contar cancelaciones:', error);
      }
    }, 500);
      
    } catch (err) {
      setError('Error al cancelar el turno');
      console.error(err);
    }
  };

  // ============================================
  // ESTADOS Y VARIABLES CALCULADAS
  // ============================================
  
  // Estado para badge de cancelaciones
  const [nuevasCancelacionesCount, setNuevasCancelacionesCount] = useState(0);
  
  // Turnos cancelados por el GUÍA (para reprogramar)
  const turnosCanceladosParaReprogramar = solicitudes.filter(s => 
    s.estado === 'cancelado' && 
    s.cancelado_por === 'guia' &&
    !reprogramaciones.some(r => r.turno_original_id === s.id && r.estado === 'completada')
  );
  
  // Turnos cancelados por el USUARIO (para pestaña cancelados)
  const turnosCanceladosPorMi = solicitudes.filter((s: Turno) => 
    s.estado === 'cancelado' && s.cancelado_por === 'usuario'
  );
  
  // Solicitudes activas
  const solicitudesActivas = solicitudes.filter(s => 
    ['pendiente', 'aceptado', 'iniciado'].includes(s.estado)
  );
  
  
  // ============================================
  // USEEFFECTS
  // ============================================

  // TEMPORAL - Para debug en consola
  useEffect(() => {
    (window as any).debugSocket = socket;
    (window as any).debugNoLeidos = noLeidos;
    (window as any).debugConnected = connected;
  }, [socket, noLeidos, connected]);

  // FORZAR RENDERIZADO CUANDO CAMBIA noLeidos
  const [, forceUpdate] = useState({});
  useEffect(() => {
    console.log('🔄 noLeidos cambió en USUARIO:', noLeidos);
    forceUpdate({});
  }, [noLeidos]);

  // FUERZA RENDER ADICIONAL MODIFICANDO SOLICITUDES
  useEffect(() => {
    console.log('🔄 FORZANDO RENDER - noLeidos:', JSON.stringify(noLeidos));
    setSolicitudes(prev => [...prev]);
  }, [noLeidos]);

  // Marcar cancelaciones como vistas al entrar a la pestaña
  useEffect(() => {
    if (pestañaActiva === 'cancelados' && turnosCanceladosPorMi.length > 0) {
      const marcarComoVistas = async () => {
        try {
          await turnosService.marcarCancelacionesVistas();
          setNuevasCancelacionesCount(0);
        } catch (error) {
          console.error('Error al marcar cancelaciones como vistas:', error);
        }
      };
      
      marcarComoVistas();
    }
  }, [pestañaActiva, turnosCanceladosPorMi]);



  // Escuchar nuevas cancelaciones por socket
  useEffect(() => {
    if (!socket) return;
    
    const handleNuevaCancelacion = async (data: any) => {
      if (data.usuarioId === user?.id || data.turnoId) {
        setTimeout(async () => {
          try {
            const result = await turnosService.contarCancelacionesNoVistas();
            setNuevasCancelacionesCount(result.count);
          } catch (error) {
            console.error('Error al contar cancelaciones:', error);
          }
        }, 500);
      }
    };

    
    socket.on('nuevo-turno-cancelado', handleNuevaCancelacion);
    
    return () => {
      socket.off('nuevo-turno-cancelado', handleNuevaCancelacion);
    };
  }, [socket, user?.id]);


  // Cargar conteo de cancelaciones no vistas al iniciar
  useEffect(() => {
    const cargarConteo = async () => {
      try {
        const result = await turnosService.contarCancelacionesNoVistas();
        setNuevasCancelacionesCount(result.count);
      } catch (error) {
        console.error('Error al cargar conteo de cancelaciones:', error);
      }
    };
    
    cargarConteo();
  }, []);

  // Cargar foto de perfil del usuario
  useEffect(() => {
    const cargarMiFoto = async () => {
      try {
        const data = await usuarioService.getMiPerfil();
        console.log('Datos del perfil:', data);
        setMiFoto(data.foto_perfil);
      } catch (err) {
        console.error('Error al cargar mi foto:', err);
      }
    };
    cargarMiFoto();
  }, []);


  // Verificar si el usuario debe completar sus datos
  // Verificar si el usuario debe completar sus datos
  useEffect(() => {
    const verificarDatos = async () => {
      try {
        const data = await usuarioService.getMiPerfil();
        setDatosCompletados(data.datos_completados);
        // Solo mostrar modal si NO tiene datos completados Y NO ha sido cerrado antes
        if (!data.datos_completados && !modalCerrado) {
          setMostrarCompletarDatos(true);
        }
      } catch (err) {
        console.error('Error al verificar datos:', err);
      }
    };
    verificarDatos();
  }, [modalCerrado]);


  const handleDatosCompletados = (cerradoPermanente?: boolean) => {
    setMostrarCompletarDatos(false);
    if (cerradoPermanente) {
      setModalCerrado(true);  // Usuario cerró voluntariamente
    } else {
      setDatosCompletados(true);
      window.location.reload();
    }
  };


  // ESCUCHAR NOTIFICACIONES EN TIEMPO REAL
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Escuchando notificaciones...');

    socket.off('nuevo-turno-creado');
    socket.off('estado-turno-actualizado');
    socket.off('nuevo-mensaje');

    socket.on('nuevo-turno-creado', (data) => {
      console.log('📨 Notificación recibida - MENSAJE:', data.mensaje);
      console.log('📨 Notificación recibida:', data);
      
      const eventId = `${data.turnoId}-${data.timestamp || Date.now()}`;
      if (ultimoEvento === eventId) {
        console.log('⏭️ Evento duplicado ignorado');
        return;
      }
      setUltimoEvento(eventId);
      
      toast.success(`✅ ${data.mensaje}`, {
        duration: 6000,
        icon: '🙏',
        style: {
          background: '#10b981',
          color: 'white',
          padding: '16px',
          maxWidth: '400px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }
      });

      cargarSolicitudes();
    });

    socket.on('nuevo-mensaje', (data) => {
      console.log('📨 NUEVO MENSAJE RECIBIDO EN USUARIO DASHBOARD:', data);
      recargarNoLeidos();
    });

    socket.on('estado-turno-actualizado', (data) => {
      console.log('🔥 ¡EVENTO RECIBIDO EN USUARIO!', data);
      cargarSolicitudes();
      cargarReprogramaciones();
      
      const eventId = `${data.turnoId}-${data.estado}-${data.timestamp || Date.now()}`;
      if (ultimoEvento === eventId) {
        console.log('⏭️ Evento duplicado ignorado');
        return;
      }
      setUltimoEvento(eventId);
      
      toast(`📢 ${data.mensaje}`, {
        duration: 5000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: 'white',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '500'
        }
      });

      cargarSolicitudes();
      cargarReprogramaciones();
    });

    return () => {
      socket.off('nuevo-turno-creado');
      socket.off('estado-turno-actualizado');
      socket.off('nuevo-mensaje');
    };
  }, [socket, connected, ultimoEvento]);

  // Cargar datos al cambiar de pestaña
  useEffect(() => {
    if (pestañaActiva === 'activas') {
      cargarSolicitudes();
    } else if (pestañaActiva === 'reprogramaciones') {
      cargarReprogramaciones();
    } else if (pestañaActiva === 'cancelados') {
      cargarSolicitudes();
    }
  }, [pestañaActiva]);

  // Auto-refresh CADA 5 SEGUNDOS
  useEffect(() => {
    if (pestañaActiva !== 'activas') return;
    
    console.log('⏱️ Iniciando refresh cada 5 segundos');
    const interval = setInterval(() => {
      console.log('🔄 Refrescando lista de turnos...');
      cargarSolicitudes(true);
    }, 5000);
    
    return () => {
      console.log('⏱️ Deteniendo refresh');
      clearInterval(interval);
    };
  }, [pestañaActiva]);

  // Auto-refresh inteligente (respaldo)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pestañaActiva === 'activas') {
      const solicitudesActivasTemp = solicitudes.filter(s => ['pendiente', 'aceptado', 'iniciado'].includes(s.estado));
      const hayActivos = solicitudesActivasTemp.length > 0;
      
      if (hayActivos) {
        console.log('🔄 Auto-refresh silencioso activo - hay turnos activos');
        interval = setInterval(() => {
          cargarSolicitudes(true);
        }, 15000);
      } else {
        console.log('⏸️ Auto-refresh pausado - no hay turnos activos');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pestañaActiva, solicitudes]);


  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

  const cargarSolicitudes = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const data = await usuarioService.getMisSolicitudes();
      setSolicitudes(data.turnos);
    } catch (err) {
      if (!silencioso) setError('Error al cargar tus solicitudes');
      console.error(err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const cargarReprogramaciones = async () => {
    try {
      setLoadingRepro(true);
      const data = await reprogramacionService.getMisReprogramaciones();
      setReprogramaciones(data);
    } catch (err) {
      setError('Error al cargar reprogramaciones');
      console.error(err);
    } finally {
      setLoadingRepro(false);
    }
  };

  const handleSolicitarApoyo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await usuarioService.solicitarApoyo(
        nuevaSolicitud.rol,
        nuevaSolicitud.mensaje,
        nuevaSolicitud.fecha_preferida || undefined
      );
      
      setNuevaSolicitud({ rol: 'apoyo', mensaje: '', fecha_preferida: ''});
      setMostrarFormulario(false);
      cargarSolicitudes();
      
    } 
    
    catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al solicitar apoyo';
      toast.error(errorMsg, {
        duration: 5000,  // 5 segundos
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px'
        }
      });
      setError(errorMsg);
      setTimeout(() => {
      setError('');
    }, 5000);
    } 
    
    finally {
      setLoading(false);
    }
  };

  const handleReprogramar = async () => {
    if (!turnoAReprogramar) return;
    
    if (!fechaPreferida) {
      toast.error('Por favor selecciona una fecha y hora para reprogramar');
      return;
    }
    
    try {
      setReprogramando(true);
      
      // Determinar preferencia según el checkbox
      const preferenciaValue = preferencia === 'otro_guia' ? 'otro_guia' : 'mismo_guia';

      console.log('Reprogramando con:', {
        turnoId: turnoAReprogramar.id,
        preferencia: preferenciaValue,
        fechaPreferida,
        comentarios
      });
      
      await usuarioService.reprogramarTurno(
        turnoAReprogramar.id,
        preferenciaValue,
        fechaPreferida,
        comentarios || undefined
      );
      
      setTurnoAReprogramar(null);
      setPreferencia('mismo_guia');
      setFechaPreferida('');
      setComentarios('');
      
      await cargarSolicitudes(true);
      await cargarReprogramaciones();
      
      if (preferenciaValue === 'mismo_guia') {
        toast.success('Turno reprogramado exitosamente con el mismo guía');
      } else {
        toast.success('Solicitud de reprogramación enviada. Un administrador te asignará un nuevo guía');
      }
      
    } catch (err) {
      setError('Error al reprogramar el turno');
      console.error(err);
      toast.error('Error al reprogramar el turno');
    } finally {
      setReprogramando(false);
    }
  };

  const handleCancelarReprogramacion = async (reprogramacionId: string) => {
    try {
      await reprogramacionService.cancelarReprogramacion(reprogramacionId);
      cargarReprogramaciones();
      cargarSolicitudes();
    } catch (err) {
      setError('Error al cancelar la solicitud');
      console.error(err);
    }
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-500 text-white';
      case 'aceptado': return 'bg-blue-500 text-white';
      case 'iniciado': return 'bg-green-500 text-white';
      case 'completado': return 'bg-gray-500 text-white';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEstadoReprogramacion = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  if (!user || user.rol !== 'usuario') {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
            <p className="text-[24px] text-gray-600 mt-3">
              <span className="font-semibold text-primario">{user.nombre}</span>
            </p>
          </div>
          
          {/* Solo mostrar tarjeta cuando NO tiene guía asignado */}
          {!usuarioGuiaActual && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-2xl">⏳</div>
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">Sin guía asignado</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Aún no tienes un guía asignado. Una vez que solicites un turno, un administrador te asignará un guía.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Mostrar Mi Guía Actual como texto normal cuando SÍ tiene guía */}
      {usuarioGuiaActual && (
        <div className="mb-6">
          <p className="text-gray-600">Mi Guía: <span className="font-semibold text-primario">{usuarioGuiaActual}</span></p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* TARJETA PARA VOLVER AL GUÍA ORIGINAL */}
      {usuarioGuiaCambio && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">🔄</div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-800">¿Quieres volver con tu guía original?</h3>
              <p className="text-sm text-blue-600 mt-1">
                Actualmente tienes asignado a <strong>{usuarioGuiaActual}</strong>. 
                Puedes solicitar volver a tu guía original <strong>{usuarioGuiaOriginal}</strong> en cualquier momento.
              </p>
              <button
                onClick={handleVolverGuiaOriginal}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Solicitar volver a mi guía original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pestañas con menú hamburguesa para móvil */}
<div className="mb-8">
  {/* Versión móvil: menú hamburguesa */}
  <div className="md:hidden">
    <button
      onClick={() => setMenuAbierto(!menuAbierto)}
      className="w-full bg-gray-100/80 p-3 rounded-2xl flex items-center justify-between"
    >
      <span className="font-medium text-primario">
        {pestañaActiva === 'activas' && '📋 Solicitudes Activas'}
        {pestañaActiva === 'reprogramaciones' && '🔄 Reprogramar'}
        {pestañaActiva === 'cancelados' && '✗ Cancelados'}
        {pestañaActiva === 'historial' && '📚 Historial'}
      </span>
      <span className={`transform transition-transform ${menuAbierto ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {menuAbierto && (
      <div className="mt-2 bg-gray-100/80 rounded-2xl p-2 space-y-1">
        <button
          onClick={() => { setPestañaActiva('activas'); setMenuAbierto(false); }}
          className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'activas' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>📋</span>
          <span>Solicitudes Activas</span>
          {solicitudesActivas.length > 0 && (
            <span className="bg-primario text-white text-xs px-2 py-0.5 rounded-full ml-auto">
              {solicitudesActivas.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => { setPestañaActiva('reprogramaciones'); setMenuAbierto(false); }}
          className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'reprogramaciones' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>🔄</span>
          <span>Reprogramar</span>
          {reprogramaciones.filter(r => r.estado === 'pendiente').length > 0 && (
            <span className="bg-alerta text-white text-xs px-2 py-0.5 rounded-full ml-auto">
              {reprogramaciones.filter(r => r.estado === 'pendiente').length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setPestañaActiva('cancelados'); setMenuAbierto(false); }}
          className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'cancelados' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>✗</span>
          <span>Cancelados</span>
          {nuevasCancelacionesCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto animate-pulse">
              {nuevasCancelacionesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setPestañaActiva('historial'); setMenuAbierto(false); }}
          className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'historial' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>📚</span>
          <span>Historial</span>
        </button>
      </div>
    )}
  </div>

  {/* Versión desktop: pestañas horizontales */}
    <div className="hidden md:flex flex-wrap gap-2 bg-gray-100/80 p-2 rounded-2xl">
      <button
        onClick={() => setPestañaActiva('activas')}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
          pestañaActiva === 'activas'
            ? 'bg-white text-primario shadow-md' 
            : 'text-texto-claro hover:bg-white/50 hover:text-primario'
        }`}
      >
        <span className="text-lg">📋</span>
        <span>Solicitudes Activas</span>
        {solicitudesActivas.length > 0 && (
          <span className="bg-primario text-white text-xs px-2 py-0.5 rounded-full">
            {solicitudesActivas.length}
          </span>
        )}
      </button>

      <button
        onClick={() => setPestañaActiva('reprogramaciones')}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
          pestañaActiva === 'reprogramaciones'
            ? 'bg-white text-primario shadow-md' 
            : 'text-texto-claro hover:bg-white/50 hover:text-primario'
        }`}
      >
        <span className="text-lg">🔄</span>
        <span>Reprogramar</span>
        {reprogramaciones.filter(r => r.estado === 'pendiente').length > 0 && (
          <span className="bg-alerta text-white text-xs px-2 py-0.5 rounded-full">
            {reprogramaciones.filter(r => r.estado === 'pendiente').length}
          </span>
        )}
      </button>

      <button
        onClick={() => setPestañaActiva('cancelados')}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
          pestañaActiva === 'cancelados'
            ? 'bg-white text-primario shadow-md' 
            : 'text-texto-claro hover:bg-white/50 hover:text-primario'
        }`}
      >
        <span className="text-lg">✗</span>
        <span>Cancelados</span>
        {nuevasCancelacionesCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            {nuevasCancelacionesCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setPestañaActiva('historial')}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
          pestañaActiva === 'historial'
            ? 'bg-white text-primario shadow-md' 
            : 'text-texto-claro hover:bg-white/50 hover:text-primario'
        }`}
      >
        <span className="text-lg">📚</span>
        <span>Historial</span>
      </button>
    </div>
  </div>

      {pestañaActiva === 'activas' && (
        <>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className={`mb-6 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg ${
              mostrarFormulario 
                ? 'bg-alerta text-white hover:bg-red-600' 
                : 'bg-primario text-white hover:bg-primario-dark'
            }`}
          >
            <span className="text-xl">{mostrarFormulario ? '✖' : '➕'}</span>
            <span>{mostrarFormulario ? 'Cancelar solicitud' : 'Solicitar apoyo'}</span>
          </button>

          {mostrarFormulario && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-primario mb-4">Nueva solicitud de apoyo</h2>
              <form onSubmit={handleSolicitarApoyo}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">rol de apoyo</label>
                  <select
                    className="input"
                    value={nuevaSolicitud.rol}
                    onChange={(e) => setNuevaSolicitud({
                      ...nuevaSolicitud,
                      rol: e.target.value as 'crisis' | 'apoyo' | 'seguimiento'
                    })}
                  >
                    <option value="apoyo">Apoyo general</option>
                    <option value="crisis">Crisis (prioridad alta)</option>
                    <option value="seguimiento">Seguimiento</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Mensaje inicial</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={nuevaSolicitud.mensaje}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, mensaje: e.target.value })}
                    placeholder="Cuéntanos cómo te sientes o qué necesitas..."
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Fecha y hora preferida (opcional)</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={nuevaSolicitud.fecha_preferida}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, fecha_preferida: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no seleccionas fecha, se asignará una automáticamente
                  </p>
                </div>

                <button type="submit" className="btn-primario w-full md:w-auto" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-semibold text-primario mb-4">Mis solicitudes activas</h2>

            {loading ? (
              <div className="text-center py-8"><p className="text-gray-500">Cargando solicitudes...</p></div>
            ) : solicitudesActivas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tienes solicitudes activas</p>
                <button onClick={() => setMostrarFormulario(true)} className="text-primario hover:underline">
                  Solicitar apoyo ahora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudesActivas.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-primario border-t border-r border-b border-gray-100 cursor-pointer"
                    onClick={() => navigate(`/turnos/${solicitud.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getColorEstado(solicitud.estado)}`}>
                            {solicitud.estado === 'pendiente' && '⏳ Pendiente'}
                            {solicitud.estado === 'aceptado' && '✅ Aceptado'}
                            {solicitud.estado === 'iniciado' && '🔄 En curso'}
                          </span>
                          <span className="text-sm text-texto-claro flex items-center gap-1">
                            <span>📅</span> {formatFecha(solicitud.fecha_programada)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-primario">👤</span>
                          <p className="font-medium">Guía:</p>
                          <div className="flex items-center gap-2">
                            <p>{solicitud.guia_nombre || 'Esperando asignación'}</p>
                            {noLeidos[solicitud.id] > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                {noLeidos[solicitud.id]}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {solicitud.modalidad && (
                          <p className="text-sm text-texto-claro mt-2 flex items-center gap-2">
                            <span className="text-secundario">📹</span>
                            <span className="font-medium">Modalidad:</span>{' '}
                            <span className="capitalize">{solicitud.modalidad}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/turnos/${solicitud.id}`); }}
                          className="bg-blue-500 text-white px-3 py-1 text-xs rounded"
                        >
                          Chatear
                        </button>
                        
                        {solicitud.estado !== 'cancelado' && solicitud.estado !== 'completado' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalCancelar({ abierto: true, turnoId: solicitud.id });
                            }}
                            className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {pestañaActiva === 'historial' && <HistorialTurnos rol="usuario" />}

      {pestañaActiva === 'reprogramaciones' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primario mb-4">
            Turnos Cancelados - Pendientes de Reprogramación
          </h2>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : turnosCanceladosParaReprogramar.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tienes turnos cancelados pendientes de reprogramación</p>
              <p className="text-sm text-gray-400 mt-2">
                Si un guía cancela tu turno, aparecerá aquí para que puedas reprogramarlo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {turnosCanceladosParaReprogramar.map((turno) => (
                <div key={turno.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Cancelado</span>
                        <span className="text-sm text-gray-500">{formatFecha(turno.fecha_programada)}</span>
                      </div>
                      <p className="font-medium">Guía: {turno.guia_nombre || 'No asignado'}</p>
                      {turno.modalidad && (
                        <p className="text-sm text-gray-600 mt-1">Modalidad: {turno.modalidad}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setTurnoAReprogramar(turno)}
                      className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark text-sm font-medium"
                    >
                      Reprogramar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Solicitudes de reprogramación enviadas */}
          {reprogramaciones.filter(r => r.estado === 'pendiente').length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Solicitudes de Reprogramación Enviadas</h3>
              <div className="space-y-4">
                {reprogramaciones.filter(r => r.estado === 'pendiente').map((rep) => (
                  <div key={rep.id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            Pendiente
                          </span>
                          <span className="text-sm text-gray-500">Solicitado: {formatFecha(rep.created_at)}</span>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Preferencia:</span>{' '}
                            {rep.preferencia === 'mismo_guia' && 'Mismo guía'}
                            {rep.preferencia === 'otro_guia' && 'Guía diferente'}
                            {rep.preferencia === 'cambiar_fecha' && 'Cambiar fecha'}
                          </p>
                          {rep.fecha_preferida && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Fecha preferida:</span> {formatFecha(rep.fecha_preferida)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleCancelarReprogramacion(rep.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancelar solicitud
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pestañaActiva === 'cancelados' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primario mb-4">
            Mis cancelaciones
          </h2>

          {turnosCanceladosPorMi.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No has cancelado ningún turno</p>
            </div>
          ) : (
            <div className="space-y-4">
              {turnosCanceladosPorMi.map((turno) => (
                <div
                  key={turno.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Cancelado
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFecha(turno.fecha_programada)}
                        </span>
                      </div>
                      <p className="font-medium">Guía: {turno.guia_nombre || 'No asignado'}</p>
                      {turno.motivo_cancelacion && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Motivo:</span> {turno.motivo_cancelacion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de reprogramación */}
      {turnoAReprogramar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reprogramar mi turno</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lamentamos que tu turno haya sido cancelado. Selecciona una nueva fecha y hora para reprogramar.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva fecha y hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                value={fechaPreferida}
                onChange={(e) => setFechaPreferida(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecciona la fecha y hora que prefieras para tu nuevo turno
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferencia === 'otro_guia'}
                  onChange={(e) => setPreferencia(e.target.checked ? 'otro_guia' : 'mismo_guia')}
                  className="w-4 h-4 text-primario rounded focus:ring-primario"
                />
                <span className="text-sm text-gray-700">Quiero un guía diferente</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                {preferencia === 'otro_guia' 
                  ? 'Se asignará un nuevo guía disponible' 
                  : 'Se reprogramará con el mismo guía'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios adicionales (opcional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                rows={3}
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Cuéntanos cualquier detalle que quieras que consideremos..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setTurnoAReprogramar(null);
                  setPreferencia('mismo_guia');
                  setFechaPreferida('');
                  setComentarios('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={reprogramando}
              >
                Cancelar
              </button>
              <button
                onClick={handleReprogramar}
                disabled={reprogramando || !fechaPreferida}
                className="px-4 py-2 text-sm font-medium text-white bg-primario hover:bg-primario-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reprogramando ? 'Procesando...' : 'Confirmar reprogramación'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal de cancelación */}
      <ModalCancelarTurno
        isOpen={modalCancelar.abierto}
        onClose={() => setModalCancelar({ abierto: false, turnoId: null })}
        onConfirm={(motivo) => {
          if (modalCancelar.turnoId) {
            handleCancelarTurno(modalCancelar.turnoId, motivo);
          }
        }}
        fechaProgramada={solicitudes.find(s => s.id === modalCancelar.turnoId)?.fecha_programada}
      />
            {/* Modal para completar datos por primera vez */}
            {mostrarCompletarDatos && (
              <CompletarDatos 
                onCompletado={() => handleDatosCompletados(false)} 
                onCerrar={() => handleDatosCompletados(true)}
                rol={user.rol} 
              />
            )}
    </Layout>
  );
};

export default UsuarioDashboard;
