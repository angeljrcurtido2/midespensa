'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface ModalSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const ModalSuccess = ({ isOpen, onClose, message }: ModalSuccessProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
        {/* Header curvo con gradiente */}
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-8 pb-12 px-6">
            <div className="absolute inset-x-0 bottom-0 h-6 bg-white dark:bg-gray-800 rounded-t-[2rem]"></div>
          </div>
          {/* Icono flotante */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-6">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="pt-10 pb-6 px-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Operación Exitosa</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSuccess;
