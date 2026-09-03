import React, { useEffect, useState } from 'react';
import { cobrosService, Entidad } from '../../services/cobrosService';
import toast from 'react-hot-toast';

const GestionEntidades: React.FC = () => {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'empresa',
    identificador: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    descuentoPorcentaje: 0,
    bolsaHorasInicial: 0
  });

  useEffect(() => {
    cargarEntidades();
  }, []);

  const cargarEntidades = async () => {
    try {
      setLoading(true);
      const data = await cobrosService.obtenerEntidades();
      setEntidades(data);
    } catch (error) {
      toast.error('Error al cargar entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cobrosService.crearEntidad(formData);
      toast.success('Entidad creada exitosamente');
      setShowModal(false);
      setFormData({
        nombre: '',
        tipo: 'empresa',
        identificador: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        descuentoPorcentaje: 0,
        bolsaHorasInicial: 0
      });
      cargarEntidades();
    } catch (error) {
      toast.error('Error al crear entidad');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primario">Gestión de Entidades</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark"
        >
          + Nueva Entidad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entidades.map((entidad) => (
          <div key={entidad.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg">{entidad.nombre}</h3>
            <p className="text-sm text-gray-600">Tipo: {entidad.tipo}</p>
            <p className="text-sm text-gray-600">
              Horas restantes: <span className="font-semibold">{entidad.bolsa_horas_restantes}</span>
            </p>
            <p className="text-sm text-gray-600">
              Descuento: <span className="font-semibold">{entidad.descuento_porcentaje}%</span>
            </p>
            {entidad.identificador && (
              <p className="text-sm text-gray-600">ID: {entidad.identificador}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal para crear entidad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Nueva Entidad</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full p-2 border rounded"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
                <select
                  className="w-full p-2 border rounded"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <option value="empresa">Empresa</option>
                  <option value="ong">ONG</option>
                  <option value="gobierno">Gobierno</option>
                </select>
                <input
                  type="text"
                  placeholder="Identificador (NIT)"
                  className="w-full p-2 border rounded"
                  value={formData.identificador}
                  onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Contacto Nombre"
                  className="w-full p-2 border rounded"
                  value={formData.contactoNombre}
                  onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Contacto Email"
                  className="w-full p-2 border rounded"
                  value={formData.contactoEmail}
                  onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Contacto Teléfono"
                  className="w-full p-2 border rounded"
                  value={formData.contactoTelefono}
                  onChange={(e) => setFormData({ ...formData, contactoTelefono: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Descuento %"
                  className="w-full p-2 border rounded"
                  value={formData.descuentoPorcentaje}
                  onChange={(e) => setFormData({ ...formData, descuentoPorcentaje: Number(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Horas iniciales"
                  className="w-full p-2 border rounded"
                  value={formData.bolsaHorasInicial}
                  onChange={(e) => setFormData({ ...formData, bolsaHorasInicial: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark flex-1"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEntidades;