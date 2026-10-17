import type{ FC } from 'react';

interface Props {
  onSeleccionarProducto: () => void;
  onCrearProducto: () => void;
}

const BotonesAcciones: FC<Props> = ({ onSeleccionarProducto }) => (
  <div className="flex justify-between items-center">
   
    <div className="flex gap-2">
      <button onClick={onSeleccionarProducto} type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
        + Seleccionar producto
      </button>
    </div>
  </div>
);

export default BotonesAcciones;
