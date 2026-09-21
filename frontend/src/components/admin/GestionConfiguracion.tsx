import React, { useEffect, useState } from 'react';
import { configuracionService } from '../../services/configuracionService';
import toast from 'react-hot-toast';

interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string;
}

const GestionConfiguracion: React.FC = () => {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const data = await configuracionService.obtenerConfiguracionCompleta();
      setConfig(data);
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (item: ConfigItem) => {
    setEditando(item.clave);
    setValorEditado(item.valor);
  };

  const handleGuardar = async (clave: string) => {
    if (!valorEditado || valorEditado.trim() === '') {
      toast.error('El valor no puede estar vacío');
      return;
    }

    // Validar que sean números para las claves numéricas
    if (['precio_sesion', 'meta_mensual_donaciones', 'duracion_sesion_minutos'].includes(clave)) {
      const num = parseInt(valorEditado);
      if (isNaN(num) || num <= 0) {
        toast.error('Debe ser un número mayor a 0');
        return;
      }
    }

    try {
      await configuracionService.actualizarValor(clave, valorEditado);
      toast.success('Configuración actualizada');
      setEditando(null);
      cargarConfiguracion();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setValorEditado('');
  };

  const formatValor = (clave: string, valor: string) => {
    if (['precio_sesion', 'meta_mensual_donaciones'].includes(clave)) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(parseInt(valor));
    }
    return valor;
  };

  const getIcono = (clave: string) => {
    switch (clave) {
      case 'precio_sesion': return '💵';
      case 'meta_mensual_donaciones': return '🎯';
      case 'duracion_sesion_minutos': return '⏱️';
      default: return '⚙️';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primario mb-2">Configuración del Sistema</h2>
      <p className="text-gray-600 mb-6">
        Ajusta los valores globales de la plataforma. Los cambios se aplican de inmediato.
      </p>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {config.map((item) => (
          <div key={item.clave} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getIcono(item.clave)}</span>
                  <h3 className="font-semibold text-gray-800">{item.descripcion || item.clave}</h3>
                </div>
                <p className="text-xs text-gray-500 font-mono">clave: {item.clave}</p>
              </div>

              <div className="flex items-center gap-3 md:min-w-[300px]">
                {editando === item.clave ? (
                  <>
                    <input
                      type="text"
                      value={valorEditado}
                      onChange={(e) => setValorEditado(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-primario rounded-lg focus:outline-none text-lg"
                      autoFocus
                    />
                    <button
                      onClick={() => handleGuardar(item.clave)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      ✅ Guardar
                    </button>
                    <button
                      onClick={handleCancelar}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm font-medium"
                    >
                      ✖
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-right">
                      <span className="text-xl font-bold text-primario">
                        {formatValor(item.clave, item.valor)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEditar(item)}
                      className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-dark text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Importante:</strong> Al cambiar el precio de la sesión, los nuevos turnos usarán el nuevo valor. Los turnos ya creados conservarán el precio con el que fueron generados.
        </p>
      </div>
    </div>
  );
};

export default GestionConfiguracion;