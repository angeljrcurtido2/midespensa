'use client';

import React from 'react';

interface ModalConfirmUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: { [key: string]: any };
}

const ModalConfirmUpdate: React.FC<ModalConfirmUpdateProps> = ({ isOpen, onClose, onConfirm, data }) => {
  if (!isOpen) return null;
  console.log("Datos del data", data)
    // Función para formatear valores específicos
  const formatValue = (key: string, value: any) => {
    if (!value) return '--';
    
    // Formatear campos de precio
    if (key === 'precio_venta' || key === 'precio_compra') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num.toLocaleString("es-PY");
    }
    
    // Formatear otros campos si es necesario
    if (key === 'iva') {
      return `${value}%`;
    }
    
    return value;
  };

  // Función para formatear nombres de campos
  const formatFieldName = (key: string) => {
    const fieldNames: { [key: string]: string } = {
      nombre_producto: 'Nombre del Producto',
      precio_venta: 'Precio de Venta',
      precio_compra: 'Precio de Compra',
      idcategoria: 'Categoría',
      ubicacion: 'Ubicación',
      cod_barra: 'Código de Barras',
      iva: 'IVA',
      estado: 'Estado',
      unidad_medida: 'Unidad de Medida'
    };
    
    return fieldNames[key] || key.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-blue-600 text-center">📦 Confirmar Actualización</h2>
        <div className="max-h-80 overflow-y-auto">
          <ul className="space-y-1 text-sm text-gray-700">
            {Object.entries(data).map(([key, value]) => (
              <li key={key} className="flex justify-between border-b py-1">
               <span className="font-medium text-gray-600">
                  {formatFieldName(key)}:
                </span>
                <span className="font-semibold text-right">
                  {formatValue(key, value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Confirmar Actualización
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmUpdate;
