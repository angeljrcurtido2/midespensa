'use client';

import { useEffect, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { getActividadEconomicaById, updateActividadEconomica } from '../../services/facturador';
import ModalSuccess from '../../components/ModalSuccess';

interface EditarActividadEconomicaProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  descripcion: '',
};

const EditarActividadEconomica = ({ id, onSuccess, onClose }: EditarActividadEconomicaProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      getActividadEconomicaById(id)
        .then((res) => {
          setFormData(res.data.data); 
        })
        .catch((error) => {
          console.error('  Error al cargar datos de la actividad económica', error);
        });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateActividadEconomica(id, formData);
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('  Error al actualizar actividad económica', error);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full">
        <h2 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">Editar Actividad Económica</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la actividad"
            />
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              <FiSave className="text-xl" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Actividad actualizada con éxito"
      />
    </div>
  );
};

export default EditarActividadEconomica;
