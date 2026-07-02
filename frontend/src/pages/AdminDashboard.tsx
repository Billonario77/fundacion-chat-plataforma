import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import SolicitudesReprogramacion from '../components/SolicitudesReprogramacion';
import EstadisticasAdmin from '../components/EstadisticasAdmin';
import Layout from '../components/Layout';
import { adminService } from '../services/adminService';
import GestionUsuarios from '../components/GestionUsuarios';
import { estadisticasService, Estadisticas } from '../services/estadisticasService';
import { SkeletonButton } from '../components/SkeletonCard';
import TurnosPendientesAsignacion from '../components/TurnosPendientesAsignacion';
import toast from 'react-hot-toast';
import AsignacionesGuia from '../components/AsignacionesGuia';
import CancelacionesAdmin from '../components/CancelacionesAdmin';
import HistorialAdmin from '../components/HistorialAdmin';
import axios from 'axios';
import Avatar from '../components/Avatar';
import { perfilService } from '../services/turnosService';

// Función para exportar a CSV
const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const csv = `${headers}\n${rows}`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Función para imprimir/PDF
const printTable = (data: any[], title: string) => {
  if (!data || data.length === 0) return;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
  ).join('');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [pestañaActiva, setPestañaActiva] = useState<'asignacion' | 'reprogramaciones' | 'estadisticas' | 'usuarios' | 'asignaciones-guia' | 'cancelaciones' | 'historial'>('usuarios');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pestañaAnterior, setPestañaAnterior] = useState(pestañaActiva);
  const [cambiandoPestaña, setCambiandoPestaña] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [hayNuevosUsuarios, setHayNuevosUsuarios] = useState(false);
  const [reprogramacionesPendientes, setReprogramacionesPendientes] = useState(0);
  
  // Estados para filtros de estadísticas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadisticasActuales, setEstadisticasActuales] = useState<Estadisticas | null>(null);
  const [miFoto, setMiFoto] = useState<string | null>(null);

  const cambiarPestaña = (nuevaPestaña: typeof pestañaActiva) => {
    if (nuevaPestaña === pestañaActiva) return;
    
    setCambiandoPestaña(true);
    setPestañaAnterior(pestañaActiva);
    setPestañaActiva(nuevaPestaña);
    
    // Si vamos a la pestaña de asignación, resetear el badge
    if (nuevaPestaña === 'asignacion') {
      setHayNuevosUsuarios(false);
    }
    
    // Pequeño delay para la animación
    setTimeout(() => {
      setCambiandoPestaña(false);
    }, 300);
  };

  const handleAsignarGuia = async (solicitudId: string, guiaId: string) => {
    try {
      setError('');
      
      await adminService.crearTurnoReprogramado(solicitudId, guiaId);
      
      toast.success('Turno reprogramado y asignado exitosamente', {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: 'white',
          padding: '16px',
          maxWidth: '400px'
        }
      });
      
      // Forzar actualización después de asignar
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 2000);
      
    } catch (err) {
      setError('Error al asignar guía');
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cargarConteoReprogramaciones = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:3001/api/admin/reprogramaciones/pendientes/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setReprogramacionesPendientes(response.data.count);
  } catch (err) {
    console.error('Error al cargar conteo de reprogramaciones:', err);
  }
};

  // Manejadores para exportación
  const handleExportarEstadisticas = (formato: 'csv' | 'pdf') => {
    if (!estadisticasActuales) return;

    if (formato === 'csv') {
      // Exportar turnos por día
      if (estadisticasActuales.turnosPorDia) {
        exportToCSV(
          estadisticasActuales.turnosPorDia.map(d => ({ fecha: d.fecha, cantidad: d.cantidad })),
          `turnos-por-dia-${estadisticasActuales.fechas.inicio}-a-${estadisticasActuales.fechas.fin}`
        );
      }
      
      // Exportar guías más activos
      if (estadisticasActuales.guiasMasActivos) {
        exportToCSV(
          estadisticasActuales.guiasMasActivos.map(g => ({ 
            nombre: g.nombre, 
            email: g.email, 
            turnos: g.totalTurnos 
          })),
          `guias-activos-${estadisticasActuales.fechas.inicio}-a-${estadisticasActuales.fechas.fin}`
        );
      }
    } else {
      // PDF (usando impresión)
      if (estadisticasActuales.turnosPorDia) {
        printTable(
          estadisticasActuales.turnosPorDia.map(d => ({ Fecha: d.fecha, Cantidad: d.cantidad })),
          `Turnos por día (${estadisticasActuales.fechas.inicio} a ${estadisticasActuales.fechas.fin})`
        );
      }
    }
  };

  // Establecer fechas por defecto (últimos 30 días)
  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
  }, []);

  // ============================================
  // ESCUCHAR EVENTOS DE SOCKET
  // ============================================
  
  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('reprogramacion-completada', () => {
      console.log('🔄 Reprogramación completada, actualizando lista...');
      setRefreshKey(prev => prev + 1);
    });

    return () => {
      socket.off('reprogramacion-completada');
    };
  }, [socket, connected]);

  // Escuchar nuevas solicitudes de reprogramación
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Escuchando evento nueva-solicitud-reprogramacion');

    socket.on('nueva-solicitud-reprogramacion', (data) => {
      console.log('🔄 Nueva solicitud de reprogramación recibida:', data);
      
      toast.success('🔄 Nueva solicitud de reprogramación', {
        duration: 6000,
        icon: '🔄',
        style: {
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          maxWidth: '400px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }
      });
      cargarConteoReprogramaciones();
      setRefreshKey(prev => prev + 1);
    });

    return () => {
      socket.off('nueva-solicitud-reprogramacion');
    };
  }, [socket, connected]);


  // Cargar foto de perfil del admin
  useEffect(() => {
    const cargarMiFoto = async () => {
      try {
        const data = await perfilService.getMiPerfil();
        setMiFoto(data.foto_perfil);
      } catch (err) {
        console.error('Error al cargar mi foto:', err);
      }
    };
    cargarMiFoto();
  }, []);

  // ============================================
  // NUEVO: Escuchar nuevos turnos para asignar
  // ============================================
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('👂 Escuchando evento nuevo-turno-para-asignar');

    socket.on('nuevo-turno-para-asignar', (data) => {
      console.log('🆕 Nuevo turno para asignar recibido:', data);
      
      // Mostrar toast de notificación
      toast.success('🆕 Nuevo usuario requiere asignación', {
        duration: 6000,
        icon: '👤',
        style: {
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          maxWidth: '400px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }
      });
      
      // Activar badge en la pestaña
      setHayNuevosUsuarios(true);
      
      // Si estamos en la pestaña de asignación, forzar actualización
      if (pestañaActiva === 'asignacion') {
        setRefreshKey(prev => prev + 1);
      }
    });

    return () => {
      socket.off('nuevo-turno-para-asignar');
    };
  }, [socket, connected, pestañaActiva]);

  // Cargar conteo de reprogramaciones pendientes al iniciar
    useEffect(() => {
      cargarConteoReprogramaciones();
    }, []);

    // Cuando entramos a la pestaña de reprogramaciones, marcar como vistas
    useEffect(() => {
      if (pestañaActiva === 'reprogramaciones') {
        setReprogramacionesPendientes(0);
      }
    }, [pestañaActiva]);

  if (!user || user.rol !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      {/* Header del dashboard */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 animate-fadeIn">
        
        <div className="flex items-center gap-4">
          <Avatar nombre={user.nombre} foto={miFoto} size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-primario">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Bienvenido, {user.nombre || 'Administrador'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Indicador de conexión WebSocket */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg transition-all hover:shadow-md">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error con animación */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-slideDown">
          {error}
        </div>
      )}
      
      {/* Pestañas */}
      <div className="mb-8">
  {/* Versión móvil: menú hamburguesa */}
  <div className="md:hidden">
    <button
      onClick={() => setMenuAbierto(!menuAbierto)}
      className="w-full bg-gray-100/80 p-3 rounded-2xl flex items-center justify-between"
    >
      <span className="font-medium text-primario">
        {pestañaActiva === 'usuarios' && '👥 Usuarios'}
        {pestañaActiva === 'asignacion' && '👤 Nuevos Usuarios'}
        {pestañaActiva === 'reprogramaciones' && '🔄 Reprogramar'}
        {pestañaActiva === 'asignaciones-guia' && '➡️ Asignaciones'}
        {pestañaActiva === 'cancelaciones' && '✗ Cancelaciones'}
        {pestañaActiva === 'historial' && '📋 Historial'}
        {pestañaActiva === 'estadisticas' && '📊 Estadísticas'}
      </span>
      <span className={`transform transition-transform ${menuAbierto ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {menuAbierto && (
      <div className="mt-2 bg-gray-100/80 rounded-2xl p-2 space-y-1">
        <button
          onClick={() => { cambiarPestaña('usuarios'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'usuarios' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>👥</span>
          <span>Usuarios</span>
        </button>
        
        <button
          onClick={() => { cambiarPestaña('asignacion'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'asignacion' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>👤</span>
          <span>Nuevos Usuarios</span>
          {hayNuevosUsuarios && pestañaActiva !== 'asignacion' && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto animate-pulse">
              !
            </span>
          )}
        </button>

        <button
          onClick={() => { cambiarPestaña('reprogramaciones'); setMenuAbierto(false); }}
          className={`w-full px-4 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'reprogramaciones' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>🔄</span>
          <span>Reprogramar</span>
          {reprogramacionesPendientes > 0 && pestañaActiva !== 'reprogramaciones' && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto animate-pulse">
              {reprogramacionesPendientes}
            </span>
          )}
        </button>

        <button
          onClick={() => { cambiarPestaña('asignaciones-guia'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'asignaciones-guia' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>➡️</span>
          <span>Asignaciones</span>
        </button>

        <button
          onClick={() => { cambiarPestaña('cancelaciones'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'cancelaciones' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>✗</span>
          <span>Cancelaciones</span>
        </button>

        <button
          onClick={() => { cambiarPestaña('historial'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'historial' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>📋</span>
          <span>Historial</span>
        </button>

        <button
          onClick={() => { cambiarPestaña('estadisticas'); setMenuAbierto(false); }}
          className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-300 flex items-center space-x-2 ${
            pestañaActiva === 'estadisticas' ? 'bg-white text-primario shadow-md' : 'hover:bg-white/50'
          }`}
        >
          <span>📊</span>
          <span>Estadísticas</span>
        </button>
      </div>
    )}
  </div>

  {/* Versión desktop: pestañas horizontales */}
  <div className="hidden md:flex flex-wrap gap-2 bg-gray-100/80 p-2 rounded-2xl">
    <button
      onClick={() => cambiarPestaña('usuarios')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'usuarios'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">👥</span>
      <span>Usuarios</span>
    </button>

    <button
      onClick={() => cambiarPestaña('asignacion')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'asignacion'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">👤</span>
      <span>Nuevos Usuarios</span>
      {hayNuevosUsuarios && pestañaActiva !== 'asignacion' && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
          !
        </span>
      )}
    </button>

    <button
      onClick={() => cambiarPestaña('reprogramaciones')}
      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'reprogramaciones'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">🔄</span>
      <span>Reprogramar</span>
      {reprogramacionesPendientes > 0 && pestañaActiva !== 'reprogramaciones' && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
          {reprogramacionesPendientes}
        </span>
      )}
    </button>

    <button
      onClick={() => cambiarPestaña('asignaciones-guia')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'asignaciones-guia'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">➡️</span>
      <span>Asignaciones</span>
    </button>

    <button
      onClick={() => cambiarPestaña('cancelaciones')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'cancelaciones'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">✗</span>
      <span>Cancelaciones</span>
    </button>

    <button
      onClick={() => cambiarPestaña('historial')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'historial'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">📋</span>
      <span>Historial</span>
    </button>

    <button
      onClick={() => cambiarPestaña('estadisticas')}
      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
        pestañaActiva === 'estadisticas'
          ? 'bg-white text-primario shadow-md' 
          : 'text-texto-claro hover:bg-white/50 hover:text-primario'
      }`}
    >
      <span className="text-lg">📊</span>
      <span>Estadísticas</span>
    </button>
  </div>
</div>

      

      {/* Contenido según pestaña con animación */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          cambiandoPestaña ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {pestañaActiva === 'reprogramaciones' && (
          <SolicitudesReprogramacion 
            key={refreshKey}
            onAsignar={handleAsignarGuia} 
          />
        )}

        {pestañaActiva === 'estadisticas' && (
          <div className="animate-fadeIn">
            <div className="mb-4 flex justify-end gap-3">
              <button
                onClick={() => handleExportarEstadisticas('csv')}
                disabled={!estadisticasActuales}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-all hover:scale-105 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm hover:shadow-md"
              >
                <span>📥</span>
                Exportar a CSV
              </button>
              <button
                onClick={() => handleExportarEstadisticas('pdf')}
                disabled={!estadisticasActuales}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all hover:scale-105 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm hover:shadow-md"
              >
                <span>🖨️</span>
                Exportar a PDF
              </button>
            </div>

            <EstadisticasAdmin 
              key={refreshKey}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              onFechasChange={(inicio, fin) => {
                setFechaInicio(inicio);
                setFechaFin(fin);
              }}
              onDatosCargados={setEstadisticasActuales}
              onNavigate={(seccion, filtro) => {
                if (seccion === 'usuarios') {
                  cambiarPestaña('usuarios');
                } else if (seccion === 'guias') {
                  cambiarPestaña('asignaciones-guia');
                } else if (seccion === 'turnos' && filtro?.estado === 'en-curso') {
                  toast('Funcionalidad en desarrollo: Ver turnos en curso');
                } else if (seccion === 'turnos' && filtro?.estado === 'completados') {
                  toast('Funcionalidad en desarrollo: Ver turnos completados');
                } else if (seccion === 'cancelaciones') {
                  cambiarPestaña('cancelaciones');
                } else if (seccion === 'guias' && filtro?.guiaId) {
                  cambiarPestaña('asignaciones-guia');
                  toast(`Ver detalles de ${filtro.guiaNombre}`);
                }
              }}
            />
          </div>
        )}

        {pestañaActiva === 'usuarios' && (
          <div className="animate-fadeIn">
            <GestionUsuarios key={refreshKey} />
          </div>
        )}

        {pestañaActiva === 'asignacion' && (
          <div className="animate-fadeIn">
            <TurnosPendientesAsignacion 
              onAsignar={() => {
                setRefreshKey(prev => prev + 1);
                setHayNuevosUsuarios(false);
              }}
            />
          </div>
        )}

        {pestañaActiva === 'asignaciones-guia' && (
          <div className="animate-fadeIn">
            <AsignacionesGuia />
          </div>
        )}

        {pestañaActiva === 'cancelaciones' && (
          <div className="animate-fadeIn">
            <CancelacionesAdmin />
          </div>
        )}

         {pestañaActiva === 'historial' && (
          <div className="animate-fadeIn">
            <HistorialAdmin />
          </div>
        )}

      </div>
    </Layout>
  );
};

export default AdminDashboard;