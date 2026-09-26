import React, { useEffect, useState } from 'react';
import { configuracionService } from '../../services/configuracionService';
import toast from 'react-hot-toast';

interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string;
}

// Nombres amigables para cada clave (lo que ve el admin)
const NOMBRES_AMIGABLES: Record<string, { titulo: string; icono: string }> = {
  precio_sesion: {
    titulo: 'Precio de una sesión (1 hora)',
    icono: '💵',
  },
  meta_mensual_donaciones: {
    titulo: 'Meta mensual de donaciones',
    icono: '🎯',
  },
  duracion_sesion_minutos: {
    titulo: 'Duración de una sesión en minutos',
    icono: '⏱️',
  },
  horas_limite_cancelacion: {
    titulo: 'Horas mínimas para cancelar sin multa',
    icono: '🕐',
  },
  horas_limite_pago: {
    titulo: 'Horas antes del inicio para pagar',
    icono: '💳',
  },
  multa_cancelacion_porcentaje: {
    titulo: 'Porcentaje de multa por cancelación tardía',
    icono: '⚠️',
  },
};

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

    const clavesNumericas = [
      'precio_sesion',
      'meta_mensual_donaciones',
      'duracion_sesion_minutos',
      'horas_limite_cancelacion',
      'horas_limite_pago',
      'multa_cancelacion_porcentaje',
    ];

    if (clavesNumericas.includes(clave)) {
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
        minimumFractionDigits: 0,
      }).format(parseInt(valor));
    }
    return valor;
  };

  const getNombre = (clave: string, descripcion: string) => {
    const amigable = NOMBRES_AMIGABLES[clave];
    if (amigable) {
      return { titulo: amigable.titulo, icono: amigable.icono };
    }
    // Fallback: si no hay nombre amigable, usar descripción o clave
    return { titulo: descripcion || clave, icono: '⚙️' };
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-primario mb-2">
        Configuración del Sistema
      </h2>
      <p className="text-sm md:text-base text-gray-600 mb-6">
        Ajusta los valores globales de la plataforma. Los cambios se aplican de inmediato.
      </p>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {config.map((item) => {
          const { titulo, icono } = getNombre(item.clave, item.descripcion);

          return (
            <div key={item.clave} className="p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                {/* Título */}
                <div className="flex items-start gap-2 md:items-center md:flex-1 min-w-0">
                  <span className="text-xl md:text-2xl flex-shrink-0">{icono}</span>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base break-words">
                    {titulo}
                  </h3>
                </div>

                {/* Valor + acción */}
                <div className="flex items-center gap-2 md:gap-3 md:min-w-[300px]">
                  {editando === item.clave ? (
                    <>
                      <input
                        type="text"
                        value={valorEditado}
                        onChange={(e) => setValorEditado(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 border-2 border-primario rounded-lg focus:outline-none text-base md:text-lg"
                        autoFocus
                      />
                      <button
                        onClick={() => handleGuardar(item.clave)}
                        className="bg-green-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-medium flex-shrink-0"
                        title="Guardar"
                      >
                        ✅
                      </button>
                      <button
                        onClick={handleCancelar}
                        className="bg-gray-300 text-gray-700 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-400 text-sm font-medium flex-shrink-0"
                        title="Cancelar"
                      >
                        ✖
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg px-3 md:px-4 py-2 text-right">
                        <span className="text-base md:text-xl font-bold text-primario break-all">
                          {formatValor(item.clave, item.valor)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEditar(item)}
                        className="bg-primario text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primario-dark text-sm font-medium flex-shrink-0"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Importante:</strong> Al cambiar el precio de la sesión, los nuevos turnos usarán
          el nuevo valor. Los turnos ya creados conservarán el precio con el que fueron generados.
        </p>
      </div>
    </div>
  );
};

export default GestionConfiguracion;