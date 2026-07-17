import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/turnosService';
import toast from 'react-hot-toast';

interface CompletarDatosProps {
  onCompletado: () => void;
  onCerrar: () => void;
  rol: 'usuario' | 'guia' | 'admin';
}

const CompletarDatos: React.FC<CompletarDatosProps> = ({ onCompletado, onCerrar, rol }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono: '',
    celular: '',
    cedula: '',
    edad: '',
    rh: '',
    sexo: '',
    estatura: '',
    peso: '',
    direccion: '',
    ciudad: '',
    tipo_adiccion: '',
    observaciones: '',
    cto_emerg_nombre: '',
    cto_emerg_celular: '',
    cto_emerg_email: '',
  });

  useEffect(() => {
    cargarDatosActuales();
  }, []);

  const cargarDatosActuales = async () => {
    try {
      const data = await usuarioService.getMiPerfil();
      setFormData({
        primer_nombre: data.primer_nombre || '',
        segundo_nombre: data.segundo_nombre || '',
        primer_apellido: data.primer_apellido || '',
        segundo_apellido: data.segundo_apellido || '',
        telefono: data.telefono || '',
        celular: data.celular || '',
        cedula: data.cedula || '',
        edad: data.edad || '',
        rh: data.rh || '',
        sexo: data.sexo || '',
        estatura: data.estatura || '',
        peso: data.peso || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        tipo_adiccion: data.tipo_adiccion || '',
        observaciones: data.observaciones || '',
        cto_emerg_nombre: data.cto_emerg_nombre || '',
        cto_emerg_celular: data.cto_emerg_celular || '',
        cto_emerg_email: data.cto_emerg_email || '',
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usuarioService.completarMisDatos(formData);
      toast.success('Datos completados correctamente');
      onCompletado();
    } catch (err) {
      console.error('Error al guardar:', err);
      toast.error('Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4">
          <h2 className="text-xl font-bold text-primario">Completar mi perfil</h2>
          <p className="text-sm text-gray-500 mt-1">Por favor completa tus datos. Solo podrás hacerlo una vez.</p>
        </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
              <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} className="input" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
              <input type="number" name="edad" value={formData.edad} onChange={handleChange} className="input" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RH</label>
              <select name="rh" value={formData.rh} onChange={handleChange} className="input">
                <option value="">Seleccionar</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
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
              <input type="number" step="0.01" name="estatura" value={formData.estatura} onChange={handleChange} className="input" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="number" name="peso" value={formData.peso} onChange={handleChange} className="input" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="input" />
            </div>

            {/* Campos solo si es usuario */}
            {rol === 'usuario' && (
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
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                Más tarde
                </button>

            <button type="submit" disabled={loading} className="btn-primario">
                {loading ? 'Guardando...' : 'Guardar mis datos'}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CompletarDatos;
