import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ModalCancelarTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  fechaProgramada?: string; // <-- NUEVO: para saber si aplica penalización
}

const ModalCancelarTurno: React.FC<ModalCancelarTurnoProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  fechaProgramada // <-- NUEVO
}) => {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  // ============================================
  // NUEVO: Calcular si aplica penalización
  // ============================================
  const calcularPenalizacion = (): boolean => {
    if (!fechaProgramada || user?.tipo !== 'usuario') return false;
    
    const fechaActual = new Date();
    const fechaTurno = new Date(fechaProgramada);
    const diffHoras = (fechaTurno.getTime() - fechaActual.getTime()) / (1000 * 60 * 60);
    
    return diffHoras < 48;
  };

  const requierePenalizacion = calcularPenalizacion();

  // Limpiar el motivo cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setMotivo('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!motivo.trim()) {
      setError('Debes indicar un motivo');
      return;
    }
    onConfirm(motivo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Cancelar Turno
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Por favor indica el motivo de la cancelación:
        </p>

        {/* ============================================ */}
        {/* NUEVO: Advertencia para usuarios */}
        {/* ============================================ */}
        {user?.tipo === 'usuario' && (
          <div className={`p-3 rounded-lg mb-4 ${
            requierePenalizacion 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm flex items-start gap-2 ${
              requierePenalizacion ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <span className="text-lg">{requierePenalizacion ? '⚠️' : 'ℹ️'}</span>
              <span>
                {requierePenalizacion ? (
                  <>
                    <strong>Cancelación con costo:</strong> Cancelaciones con menos de 48 horas de antelación, tienen un costo del 50% del valor de la sesión.
                  </>
                ) : (
                  <>
                    <strong>Cancelación sin costo</strong> Cancelaciones con más de 48 horas de antelación, No tienen costo.
                  </>
                )}
              </span>
            </p>
          </div>
        )}
        
        <textarea
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setError('');
          }}
          className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primario`}
          rows={4}
          placeholder="Escribe el motivo aquí..."
          autoFocus
        />
        
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              user?.tipo === 'usuario' && requierePenalizacion
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCancelarTurno;