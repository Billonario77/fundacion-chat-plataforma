import React, { useEffect, useState } from 'react';
import { adminUsuariosService, Usuario } from '../services/adminUsuariosService';
import ModalEditarUsuario from './ModalEditarUsuario';
import toast from 'react-hot-toast';

type TabType = 'usuarios' | 'guias';

const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pestaña, setPestaña] = useState<TabType>('usuarios');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [modalEditar, setModalEditar] = useState<{ 
  abierto: boolean; 
  usuario: Usuario | null 
  }>({
    abierto: false,
    usuario: null
  });

  const cargarUsuarios = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminUsuariosService.getUsuarios(page, 20, search);
      
      // 👈 CORREGIDO: Acceder a data.data en lugar de data directamente
      setUsuarios(data.data);
      setTotalPaginas(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
      setPagina(page);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(1, busqueda);
  }, [busqueda]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarUsuarios(1, busqueda);
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      cargarUsuarios(nuevaPagina, busqueda);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setModalEditar({ abierto: true, usuario });
  };

  const handleGuardarEdicion = async (id: string, datos: Partial<Usuario>) => {
    try {
      await adminUsuariosService.actualizarUsuario(id, datos);
      toast.success('Usuario actualizado correctamente');
      setModalEditar({ abierto: false, usuario: null });
      cargarUsuarios(pagina, busqueda);
    } catch (err) {
      toast.error('Error al actualizar usuario');
      console.error(err);
    }
  };

  const handleCambiarRol = async (id: string, rol: string) => {
    try {
      await adminUsuariosService.cambiarRol(id, rol);
      toast.success('Rol actualizado correctamente');
      cargarUsuarios(pagina, busqueda);
    } catch (err) {
      toast.error('Error al cambiar rol');
      console.error(err);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    
    try {
      await adminUsuariosService.eliminarUsuario(id);
      toast.success('Usuario eliminado correctamente');
      cargarUsuarios(pagina, busqueda);
    } catch (err) {
      toast.error('Error al eliminar usuario');
      console.error(err);
    }
  };

  const getColorEstado = (disponible: boolean) => {
    return disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getColorRol = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'guia': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-primario mb-6">👥 Gestión de Usuarios</h2>
        <p className="text-gray-500">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-primario mb-6">👥 Gestión de Usuarios</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Barra de búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-2 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
        />
        <button
          type="submit"
          className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Pestañas */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPestaña('usuarios')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            pestaña === 'usuarios'
              ? 'bg-primario text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Usuarios ({totalItems})
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay usuarios registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primario text-white flex items-center justify-center text-sm font-medium">
                        {usuario.nombre?.charAt(0) || 'U'}
                      </div>
                      <span className="font-medium text-gray-900">{usuario.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorRol(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(usuario.disponible)}`}>
                      {usuario.disponible ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {usuario.datos_completados ? '✅ Completos' : '⏳ Pendientes'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditar(usuario)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          const nuevoRol = usuario.rol === 'usuario' ? 'guia' : 'usuario';
                          handleCambiarRol(usuario.id, nuevoRol);
                        }}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Cambiar rol
                      </button>
                      <button
                        onClick={() => handleEliminar(usuario.id, usuario.nombre)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Mostrando {usuarios.length} de {totalItems} usuarios
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCambiarPagina(pagina - 1)}
              disabled={pagina === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 rounded-lg bg-primario text-white text-sm">
              {pagina} / {totalPaginas}
            </span>
            <button
              onClick={() => handleCambiarPagina(pagina + 1)}
              disabled={pagina === totalPaginas}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      // En GestionUsuarios.tsx, en la sección del modal:

      {/* Modal de edición */}
      {modalEditar.abierto && modalEditar.usuario && (
        <ModalEditarUsuario
          usuarioId={modalEditar.usuario.id}  // 👈 CAMBIAR: usuario → usuarioId
          onGuardar={handleGuardarEdicion}
          onCerrar={() => setModalEditar({ abierto: false, usuario: null })}
        />
      )}
    </div>
  );
};

export default GestionUsuarios;8