import React, { useEffect, useState } from 'react';
import { adminUsuariosService } from '../services/adminUsuariosService';
import toast from 'react-hot-toast';

interface ModalEditarUsuarioProps {
  isOpen: boolean;
  usuarioId: string | null;
  onClose: () => void;
  onUsuarioActualizado: () => void;
}

const ModalEditarUsuario: React.FC<ModalEditarUsuarioProps> = ({
  isOpen,
  usuarioId,
  onClose,
  onUsuarioActualizado
}) => {
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    telefono: '',
    celular: '',
    cedula: '',
    edad: null as number | null,
    rh: '',
    sexo: '',
    estatura: null as number | null,
    peso: null as number | null,
    direccion: '',
    ciudad: '',
    tipo_adiccion: '',
    observaciones: '',
    cto_emerg_nombre: '',
    cto_emerg_celular: '',
    cto_emerg_email: '',
    rol: '',
    activo: true,
    disponible: true,
    foto_perfil: ''
  });

  useEffect(() => {
    if (isOpen && usuarioId) {
      cargarUsuario();
    }
  }, [isOpen, usuarioId]);

  const cargarUsuario = async () => {
    if (!usuarioId) return;
    setCargandoDatos(true);
    try {
      const data = await adminUsuariosService.getUsuarioById(usuarioId);
      setFormData({
        primer_nombre: data.primer_nombre || '',
        segundo_nombre: data.segundo_nombre || '',
        primer_apellido: data.primer_apellido || '',
        segundo_apellido: data.segundo_apellido || '',
        email: data.email || '',
        telefono: data.telefono || '',
        celular: data.celular || '',
        cedula: data.cedula || '',
        edad: data.edad ?? null,
        rh: data.rh || '',
        sexo: data.sexo || '',
        estatura: data.estatura ?? null,
        peso: data.peso ?? null,
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        tipo_adiccion: data.tipo_adiccion || '',
        observaciones: data.observaciones || '',
        cto_emerg_nombre: data.cto_emerg_nombre || '',
        cto_emerg_celular: data.cto_emerg_celular || '',
        cto_emerg_email: data.cto_emerg_email || '',
        rol: data.rol || 'usuario',
        activo: data.activo ?? true,
        disponible: data.disponible ?? true,
        foto_perfil: data.foto_perfil || ''
      });
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioId) return;
    
    setLoading(true);
    try {
      const datosParaEnviar = {
        ...formData,
        edad: formData.edad === null ? null : Number(formData.edad),
        peso: formData.peso === null ? null : Number(formData.peso),
        estatura: formData.estatura === null ? null : Number(formData.estatura),
        // Si no es usuario, limpiar campos específicos
        tipo_adiccion: formData.rol === 'usuario' ? formData.tipo_adiccion : null,
        observaciones: formData.rol === 'usuario' ? formData.observaciones : null,
        cto_emerg_nombre: formData.rol === 'usuario' ? formData.cto_emerg_nombre : null,
        cto_emerg_celular: formData.rol === 'usuario' ? formData.cto_emerg_celular : null,
        cto_emerg_email: formData.rol === 'usuario' ? formData.cto_emerg_email : null,
      };
      
      await adminUsuariosService.actualizarPerfil(usuarioId, datosParaEnviar);
      toast.success('Perfil actualizado correctamente');
      onUsuarioActualizado();
      onClose();
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    };

    // AGREGAR ESTA FUNCIÓN DESPUÉS
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limitar tamaño a 200KB
        if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 2MB. Por favor, elige una imagen más pequeña.');
        e.target.value = '';
        return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // Reducir calidad de la imagen
            const img = new Image();
            img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 150;
            const MAX_HEIGHT = 150;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convertir a JPEG con calidad 0.7
            const fotoRedimensionada = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => ({ ...prev, foto_perfil: fotoRedimensionada }));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
        };

  const esUsuario = formData.rol === 'usuario';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-primario">Editar Usuario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {cargandoDatos ? (
          <div className="p-8 text-center">Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información personal */}
              <div className="col-span-2">
                <h3 className="font-semibold text-primario border-b pb-2 mb-3">Información Personal</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre *</label>
                <input type="text" name="primer_nombre" value={formData.primer_nombre} onChange={handleChange} className="input" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
                <input type="text" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido *</label>
                <input type="text" name="primer_apellido" value={formData.primer_apellido} onChange={handleChange} className="input" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                <input type="text" name="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange} className="input" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <input type="number" name="edad" value={formData.edad ?? ''} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RH</label>
                <select name="rh" value={formData.rh} onChange={handleChange} className="input">
                  <option value="">Seleccionar</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} className="input">
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input type="text" name="celular" value={formData.celular} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estatura (m)</label>
                <input type="number" step="0.01" name="estatura" value={formData.estatura ?? ''} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input type="number" name="peso" value={formData.peso ?? ''} onChange={handleChange} className="input" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="input" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
                <input type="file" name="foto_perfil" accept="image/*" onChange={handleFileChange} className="input" />
                {formData.foto_perfil && (
                    <div className="mt-2">
                    <img src={formData.foto_perfil} alt="Vista previa" className="w-20 h-20 rounded-full object-cover" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto_perfil: '' }))} className="text-red-600 text-sm mt-1">
                        Eliminar
                    </button>
                    </div>
                )}
                </div>

              {/* Campos solo para usuarios */}
              {esUsuario && (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Adicción</label>
                    <input type="text" name="tipo_adiccion" value={formData.tipo_adiccion} onChange={handleChange} className="input" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea name="observaciones" rows={3} value={formData.observaciones} onChange={handleChange} className="input" />
                  </div>

                  <div className="col-span-2">
                    <h3 className="font-semibold text-primario border-b pb-2 mb-3">Contacto de Emergencia</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input type="text" name="cto_emerg_nombre" value={formData.cto_emerg_nombre} onChange={handleChange} className="input" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                    <input type="text" name="cto_emerg_celular" value={formData.cto_emerg_celular} onChange={handleChange} className="input" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="cto_emerg_email" value={formData.cto_emerg_email} onChange={handleChange} className="input" />
                  </div>
                </>
              )}

              {/* Configuración */}
              <div className="col-span-2 mt-2">
                <h3 className="font-semibold text-primario border-b pb-2 mb-3">Configuración</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select name="rol" value={formData.rol} onChange={handleChange} className="input">
                  <option value="usuario">Usuario</option>
                  <option value="guia">Guía</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Usuario Activo</span>
                </label>
              </div>
              
              {formData.rol === 'guia' && (
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="disponible" checked={formData.disponible} onChange={handleChange} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Guía Disponible</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primario">
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalEditarUsuario;