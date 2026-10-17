'use client';

import { useEffect, useState } from 'react';
import { getCategoryById, updateCategory } from '../../services/categorias';
import { FiSave } from 'react-icons/fi';

interface EditarCategoriaProps {
  id: number | string; 
  onSuccess?: () => void;  
  onClose?: () => void;  
}
const initialForm = {
  categoria: '',
  estado: 'activo',
};

const EditarCategoria = ({ id, onSuccess, onClose }: EditarCategoriaProps) => {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (id) {
      getCategoryById(id)
        .then((res) => {
          setFormData(res.data);
        })
        .catch((error) => {
          console.error('  Error al cargar datos de la categoría', error);
        });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Este form se abre dentro del <form> de Nueva Compra (vía
    // ModalSeleccionarCategoria). React re-emite el submit por su árbol de
    // componentes, así que sin esto alcanzaba al onSubmit de la compra.
    e.stopPropagation();

    try {
      await updateCategory(id, formData);
      // El aviso de éxito lo muestra el contenedor (ListarCategorias) desde
      // onSuccess, que además refresca la lista. Abrir también el de este
      // componente encadenaba dos modales y obligaba a confirmar dos veces.
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('  Error al actualizar categoría', error);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">✏️ Editar Categoría</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de categoría"
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
    </div>
  );
};

export default EditarCategoria;
