import React, { useEffect, useState } from 'react';
import { adminUsuariosService, Usuario, Guia } from '../services/adminUsuariosService';
import ModalEditarUsuario from './ModalEditarUsuario';

type TabType = 'usuarios' | 'guias';

const GestionUsuarios: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<TabType>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [guias, setGuias] = useState<Guia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editandoRol, setEditandoRol] = useState<string | null>(null);
  const [nuevoRol, setNuevoRol] = useState<string>('');
  const [modalEditar, setModalEditar] = useState<{ abierto: boolean; usuarioId: string | null }>({
    abierto: false,
    usuarioId: null
  });

  useEffect(() => {
    if (tabActiva === 'usuarios') {
      cargarUsuarios();
    } else {
      cargarGuias();
    }
  }, [tabActiva]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminUsuariosService.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarGuias = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminUsuariosService.getGuias();
      setGuias(data);
    } catch (err) {
      setError('Error al cargar guías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUsuario = async (usuarioId: string) => {
    try {
      setError('');
      setSuccess('');
      const usuarioActualizado = await adminUsuariosService.toggleUsuarioEstado(usuarioId);
      
      setUsuarios(usuarios.map(u => 
        u.id === usuarioActualizado.id ? usuarioActualizado : u
      ));
      
      setSuccess(`Usuario ${usuarioActualizado.activo ? 'activado' : 'desactivado'} correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al cambiar estado del usuario');
      console.error(err);
    }
  };

  const handleToggleGuia = async (guiaId: string) => {
    try {
      setError('');
      setSuccess('');
      const guiaActualizado = await adminUsuariosService.toggleGuiaDisponibilidad(guiaId);
      
      setGuias(guias.map(g => 
        g.id === guiaActualizado.id ? guiaActualizado : g
      ));
      
      setSuccess(`Guía ${guiaActualizado.disponible ? 'disponible' : 'no disponible'} correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al cambiar disponibilidad del guía');
      console.error(err);
    }
  };

  const handleCambiarRol = async (usuarioId: string) => {
        if (!nuevoRol) {
        setError('Debe seleccionar un rol');
        return;
      }
    try {
      setError('');
      setSuccess('');
      const usuarioActualizado = await adminUsuariosService.actualizarRol(usuarioId, nuevoRol);
      
      setUsuarios(usuarios.map(u => 
        u.id === usuarioActualizado.id ? usuarioActualizado : u
      ));
      
      setEditandoRol(null);
      setNuevoRol('');
      setSuccess(`Rol actualizado a ${usuarioActualizado.rol}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar rol');
      console.error(err);
    }
  };

  const handleEditarUsuario = (usuarioId: string) => {
    setModalEditar({ abierto: true, usuarioId });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primario">Gestión de Usuarios</h2>
        
        {/* Pestañas */}
        <div className="flex space-x-2 bg-gray-100/80 p-1 rounded-lg">
          <button
            onClick={() => setTabActiva('usuarios')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tabActiva === 'usuarios'
                ? 'bg-white text-primario shadow'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => setTabActiva('guias')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tabActiva === 'guias'
                ? 'bg-white text-primario shadow'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            🎯 Guías
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <p className="text-gray-500 text-center py-8">Cargando...</p>
      ) : tabActiva === 'usuarios' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Registro</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{usuario.nombre}</td>
                  <td className="px-4 py-3 text-sm">{usuario.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {editandoRol === usuario.id ? (
                      <select
                        value={nuevoRol}
                        onChange={(e) => setNuevoRol(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="usuario">Usuario</option>
                        <option value="guia">Guía</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                        usuario.rol === 'guia' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {usuario.rol}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatFecha(usuario.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      {editandoRol === usuario.id ? (
                        <>
                          <button
                            onClick={() => handleCambiarRol(usuario.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditandoRol(null);
                              setNuevoRol('');
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditarUsuario(usuario.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Editar
                          </button>
                          {usuario.rol !== 'admin' && (
                            <button
                              onClick={() => handleToggleUsuario(usuario.id)}
                              className={`text-sm ${
                                usuario.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {usuario.activo ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditandoRol(usuario.id);
                              setNuevoRol(usuario.rol);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Cambiar rol
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Disponibilidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Registro</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guias.map((guia) => (
                <tr key={guia.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{guia.nombre}</td>
                  <td className="px-4 py-3 text-sm">{guia.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      guia.disponible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guia.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatFecha(guia.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleToggleGuia(guia.id)}
                      className={`text-sm ${
                        guia.disponible ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {guia.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalEditarUsuario
        isOpen={modalEditar.abierto}
        usuarioId={modalEditar.usuarioId}
        onClose={() => setModalEditar({ abierto: false, usuarioId: null })}
        onUsuarioActualizado={() => {
          cargarUsuarios();
          cargarGuias();
        }}
      />
    </div>
  );
};

export default GestionUsuarios;
