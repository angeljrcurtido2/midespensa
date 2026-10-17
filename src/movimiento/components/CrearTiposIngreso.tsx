'use client';

import { useState } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { createTipoIngreso } from '../../services/ingreso';

interface CrearTiposIngresoProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const CrearTiposIngreso = ({ onSuccess, onClose }: CrearTiposIngresoProps) => {
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleCrear = async () => {
    setMensaje('');
    setError('');

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    try {
      const res = await createTipoIngreso({ descripcion: descripcion.trim() });
      setDescripcion('');
      setMensaje(res.data.message || 'Tipo de ingreso creado correctamente.');
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear tipo de ingreso.');
    }
  };

return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
         Crear Tipo de Ingreso
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Venta contado, Cobro deuda, etc."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      <button
        onClick={handleCrear}
        className="w-full bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 text-white font-medium py-2 rounded-lg flex justify-center items-center gap-2 transition-all duration-150"
      >
        <span>Crear</span>
      </button>

      {mensaje && (
        <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <FaCheckCircle className="h-5 w-5" />
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <FaExclamationCircle className="h-5 w-5" />
          {error}
        </div>
      )}
    </div>
  );
};

export default CrearTiposIngreso;
