import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3001/api';

interface GuiaConUsuarios {
  guiaId: string;
  guiaNombre: string;
  guiaEmail: string;
  usuarios: {
    usuarioId: string;
    usuarioNombre: string;
    usuarioEmail: string;
    ultimoTurno: string;
    totalTurnos: number;
  }[];
}

interface UsuarioConGuia {
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  guia_id: string | null;
  guia_nombre: string | null;
  guia_email: string | null;
  ultimo_turno: string | null;
}

const AsignacionesGuia: React.FC = () => {
  const [guias, setGuias] = useState<GuiaConUsuarios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<UsuarioConGuia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [vista, setVista] = useState<'por-guia' | 'buscar-usuario'>('por-guia');
  const [todosUsuarios, setTodosUsuarios] = useState<UsuarioConGuia[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  useEffect(() => {
    if (vista === 'por-guia') {
      cargarGuiasConUsuarios();
    } else if (vista === 'buscar-usuario') {
      cargarTodosUsuarios();
    }
  }, [vista]);


  useEffect(() => {
    if (vista === 'buscar-usuario') {
      if (busqueda === '') {
        setResultadosBusqueda(todosUsuarios);
      } else {
        const timeout = setTimeout(() => {
          buscarUsuario(busqueda);
        }, 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [busqueda, vista, todosUsuarios]);


  const cargarGuiasConUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/asignaciones/guias-con-usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuias(response.data);
    } catch (err) {
      setError('Error al cargar asignaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buscarUsuario = (terminoBuscado?: string) => {
    const termino = (terminoBuscado !== undefined ? terminoBuscado : busqueda).toLowerCase().trim();
    
    if (!termino) {
      setResultadosBusqueda(todosUsuarios);
      return;
    }

    const filtrados = todosUsuarios.filter(usuario => 
      usuario.usuario_nombre.toLowerCase().includes(termino) ||
      usuario.usuario_email.toLowerCase().includes(termino)
    );
    setResultadosBusqueda(filtrados);
    
    if (filtrados.length === 0 && termino) {
      toast.success('No se encontraron usuarios con ese término');
    }
  };


  const cargarTodosUsuarios = async () => {
    try {
      setCargandoUsuarios(true);
      const token = localStorage.getItem('token');
      // Este endpoint debería devolver todos los usuarios con su guía
      const response = await axios.get(`${API_URL}/admin/usuarios-con-guia`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodosUsuarios(response.data);
      setResultadosBusqueda(response.data); // Mostrar todos inicialmente
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setCargandoUsuarios(false);
    }
  };


  const formatFecha = (fecha: string) => {
    if (!fecha) return 'Sin turnos';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  if (loading && vista === 'por-guia') {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-primario mb-6">
          👥 Asignaciones Guía-Usuario
        </h2>
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-primario mb-6">
        👥 Asignaciones Guía-Usuario
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Selector de vista */}
      <div className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl inline-flex mb-6">
        <button
          onClick={() => setVista('por-guia')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            vista === 'por-guia'
              ? 'bg-white text-primario shadow-md' 
              : 'text-texto-claro hover:bg-white/50 hover:text-primario'
          }`}
        >
          👥 Ver por Guía
        </button>
        <button
          onClick={() => setVista('buscar-usuario')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            vista === 'buscar-usuario'
              ? 'bg-white text-primario shadow-md' 
              : 'text-texto-claro hover:bg-white/50 hover:text-primario'
          }`}
        >
          🔍 Buscar Usuario
        </button>
      </div>

      {vista === 'por-guia' && (
        <div className="space-y-6">
          {guias.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay guías disponibles
            </p>
          ) : (
            guias.map((guia) => (
              <div key={guia.guiaId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-primario text-white px-4 py-3">
                  <h3 className="font-semibold">{guia.guiaNombre}</h3>
                  <p className="text-sm opacity-90">{guia.guiaEmail}</p>
                </div>
                
                {guia.usuarios.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">
                    Este guía no tiene usuarios asignados actualmente
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {guia.usuarios.map((usuario, idx) => (
                      <div key={`${guia.guiaId}-${usuario.usuarioId}-${idx}`} className="p-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                          <div>
                            <p className="font-medium">{usuario.usuarioNombre}</p>
                            <p className="text-sm text-gray-600">{usuario.usuarioEmail}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Último turno:</span>{' '}
                            {formatFecha(usuario.ultimoTurno)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {vista === 'buscar-usuario' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                const valor = e.target.value;
                setBusqueda(valor);
                if (valor === '') {
                  setResultadosBusqueda(todosUsuarios);
                }
              }}
              placeholder="Buscar por nombre o email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
              onKeyPress={(e) => e.key === 'Enter' && buscarUsuario()}
            />
            <button
              onClick={() => buscarUsuario(busqueda)}
              className="bg-primario text-white px-6 py-2 rounded-lg hover:bg-primario-dark transition-colors"
            >
              Buscar
            </button>
          </div>
          
          {cargandoUsuarios ? (
            <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
          ) : resultadosBusqueda.length > 0 ? (
            <div className="space-y-4">
              {resultadosBusqueda.map((usuario) => (
                <div key={usuario.usuario_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <p className="font-medium text-gray-800">{usuario.usuario_nombre}</p>
                      <p className="text-sm text-gray-600 mb-2">{usuario.usuario_email}</p>
                      <p className="text-sm text-gray-500">
                        Último turno: {formatFecha(usuario.ultimo_turno || '')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg min-w-[200px]">
                      {usuario.guia_nombre ? (
                        <>
                          <p className="text-sm font-medium text-primario">Guía asignado:</p>
                          <p className="text-sm text-gray-700">{usuario.guia_nombre}</p>
                          <p className="text-xs text-gray-500">{usuario.guia_email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No tiene guía asignado</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default AsignacionesGuia;