'use client';

import { useState } from 'react';
import { createCategory } from '../../services/categorias';
// ModalError apuntaba a ModalSuccess: los errores se mostraban con la tarjeta
// verde de "Operación Exitosa".
import ModalError from '../../components/ModalError';
import { styleButton } from '../../proveedor/utils/utils';
import { renderInput } from '../../clientes/utils/utils';

interface CrearCategoriaProps {
    onSuccess: () => void;
    onClose: () => void;
}

const CrearCategoria = ({ onClose, onSuccess }: CrearCategoriaProps) => {
    const initialForm = {
        categoria: '',
    };
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Este formulario se abre dentro del <form> de Nueva Compra (vía
        // ModalSeleccionarCategoria). Headless UI lo saca del DOM con un portal,
        // pero React re-emite los eventos por su árbol de componentes, así que
        // sin esto el submit alcanzaba al onSubmit de la compra y disparaba el
        // modal de confirmar compra al guardar una categoría.
        e.stopPropagation();
        try {
            await createCategory(formData);
            setFormData(initialForm);
            // El aviso de éxito lo muestra el contenedor (ListarCategorias) desde
            // onSuccess, que además refresca la lista. Antes este componente abría
            // también el suyo, así que salían dos modales encadenados y había que
            // pulsar "Continuar" dos veces.
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorMessage(' ' + error.response.data.error);
            setErrorModalOpen(true);
        }
    };

    return (
        <div className="flex items-center justify-center px-4 border border-blue-300 dark:border-gray-600 rounded-lg shadow-lg">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full">
                <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
                    Crear Categorias
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderInput('categoria', 'Nombre de categoría', formData.categoria, handleChange)}
                    <button
                        type="submit"
                        className={styleButton}
                    >
                        Guardar Categoria
                    </button>

                </form>
            </div>
            <ModalError
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                message={errorMessage}
            />
        </div>

    );
};

export default CrearCategoria;
