'use client';

import { type FC } from 'react';

interface ModalAdvertParcialProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onSum: () => void;
  nombreProducto: string;
  cantidadExistente: number;
  cantidadParcial: number;
}

const ModalAdvertParcial: FC<ModalAdvertParcialProps> = ({
  isOpen,
  onClose,
  onReplace,
  onSum,
  nombreProducto,
  cantidadExistente,
  cantidadParcial,
}) => {
  if (!isOpen) return null;
    
  return (
    <div className="fixed inset-0 z-50 bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-[90%] max-w-md rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold text-red-600 mb-2">Producto ya agregado</h2>
        <p className="mb-4 text-gray-700">
          El producto <strong>{nombreProducto}</strong> ya fue agregado con una cantidad de <strong>{cantidadExistente}</strong> unidades.
          Has ingresado una nueva cantidad parcial de <strong>{cantidadParcial}</strong> unidades.
        </p>

        <p className="mb-4 text-sm text-gray-600">¿Qué desea hacer con esta nueva cantidad parcial?</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onReplace}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded transition"
          >
            🔄 Reemplazar cantidad existente
          </button>

          <button
            onClick={onSum}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
          >
            ➕ Sumar a cantidad existente
          </button>

          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-4 py-2 rounded transition"
          >
              Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAdvertParcial;
