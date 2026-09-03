import React, { useEffect, useState } from 'react';
import { cobrosService, Cupon } from '../../services/cobrosService';
import toast from 'react-hot-toast';

const GestionCupones: React.FC = () => {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    descripcion: string;
    tipo: 'porcentaje' | 'fijo' | 'gratis';
    valor: number;
    aplicaA: 'nuevos' | 'antiguos' | 'todos';
    usosMaximos: number;
  }>({
    descripcion: '',
    tipo: 'porcentaje',
    valor: 0,
    aplicaA: 'todos',
    usosMaximos: 1
  });

  useEffect(() => {
    cargarCupones();
  }, []);

  const cargarCupones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cobros/cupones`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCupones(data.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await cobrosService.crearCupon(formData);
      if (response.success) {
        toast.success(`Cupón creado: ${response.data.codigo}`);
        setShowModal(false);
        setFormData({
          descripcion: '',
          tipo: 'porcentaje',
          valor: 0,
          aplicaA: 'todos',
          usosMaximos: 1
        });
        cargarCupones();
      }
    } catch (error) {
      toast.error('Error al crear cupón');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primario">Gestión de Cupones</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark"
        >
          + Nuevo Cupón
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cupones.map((cupon) => (
          <div key={cupon.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg">{cupon.descripcion}</h3>
              <span className={`px-2 py-1 rounded text-xs ${cupon.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {cupon.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Código: <span className="font-mono">{cupon.codigo}</span></p>
            <p className="text-sm text-gray-600">Tipo: {cupon.tipo}</p>
            <p className="text-sm text-gray-600">Valor: {cupon.valor}{cupon.tipo === 'porcentaje' ? '%' : ' COP'}</p>
            <p className="text-sm text-gray-600">Usos: {cupon.usos_actuales}/{cupon.usos_maximos}</p>
            <p className="text-sm text-gray-600">Aplica a: {cupon.aplica_a}</p>
          </div>
        ))}
      </div>

      {/* Modal para crear cupón */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Nuevo Cupón</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full p-2 border rounded"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
                <select
                  className="w-full p-2 border rounded"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="fijo">Fijo (COP)</option>
                  <option value="gratis">Gratis</option>
                </select>
                <input
                  type="number"
                  placeholder={formData.tipo === 'porcentaje' ? 'Valor %' : 'Valor COP'}
                  className="w-full p-2 border rounded"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                  required
                />
                <select
                  className="w-full p-2 border rounded"
                  value={formData.aplicaA}
                  onChange={(e) => setFormData({ ...formData, aplicaA: e.target.value as any })}
                >
                  <option value="todos">Todos</option>
                  <option value="nuevos">Nuevos usuarios</option>
                  <option value="antiguos">Usuarios antiguos</option>
                </select>
                <input
                  type="number"
                  placeholder="Usos máximos"
                  className="w-full p-2 border rounded"
                  value={formData.usosMaximos}
                  onChange={(e) => setFormData({ ...formData, usosMaximos: Number(e.target.value) })}
                  min="1"
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

export default GestionCupones;