'use client';

import { useState } from 'react';
import { createActividadEconomica } from '../../services/facturador';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';

interface CrearActividadesEconomicasProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialFormActividad = {
  descripcion: ''
};

const styleButton = "w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition";

const CrearActividadesEconomicas = ({ onSuccess, onClose }: CrearActividadesEconomicasProps) => {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState(initialFormActividad);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createActividadEconomica(formData);
      setSuccessModalOpen(true);
      setFormData(initialFormActividad);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error(error);
      setErrorMessage('  ' + (error.response?.data?.error || 'Error desconocido'));
      setErrorModalOpen(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose && onClose();
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br to-white dark:to-gray-800 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">
          Crear Actividad Económica
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="descripcion"
            placeholder="Descripción de la actividad"
            value={formData.descripcion}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <button
            type="submit"
            className={styleButton}
          >
            Guardar Actividad
          </button>
        </form>
      </div>

      {/* Modales */}
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Actividad creada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default CrearActividadesEconomicas;
