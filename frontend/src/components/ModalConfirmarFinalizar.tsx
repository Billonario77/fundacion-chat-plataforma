import React from 'react';

interface ModalConfirmarFinalizarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mensaje?: string;
}

const ModalConfirmarFinalizar: React.FC<ModalConfirmarFinalizarProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mensaje = '¿Estás seguro de finalizar esta sesión?'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        {/* Icono de advertencia */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg 
            className="h-8 w-8 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Título */}
        <h3 className="text-center text-xl font-bold text-gray-900 mb-2">
          Finalizar Sesión
        </h3>

        {/* Mensaje */}
        <p className="text-center text-gray-600 mb-6">
          {mensaje}
        </p>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Sí, finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmarFinalizar;