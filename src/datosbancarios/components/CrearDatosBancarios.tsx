'use client';

import { useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { FaSave, FaUniversity, FaCreditCard, FaUser, FaFileAlt, FaPlus } from 'react-icons/fa';
import { createDatosBancarios } from '../../services/datosBancarios';
import { renderTitle } from '../../clientes/utils/utils';

interface CrearDatosBancariosProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  banco_origen: '',
  numero_cuenta: '',
  tipo_cuenta: '',
  titular_cuenta: '',
  observacion: ''
};

const CrearDatosBancarios = ({ onSuccess, onClose }: CrearDatosBancariosProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createDatosBancarios(formData);
      setSuccessModalOpen(true);
      setFormData(initialForm);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error(error);
      setErrorMessage('  ' + (error.response?.data?.error || 'Error al crear dato bancario'));
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose && onClose();
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden dark:bg-gray-800">
        {renderTitle({
          title: "Crear Dato Bancario",
          subtitle: "Registra una nueva cuenta bancaria",
          icon: <FaPlus className="text-2xl" />
        })}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Banco de Origen */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaUniversity className="text-blue-600 dark:text-gray-200" />
                Banco de Origen
              </label>
              <input
                type="text"
                name="banco_origen"
                value={formData.banco_origen}
                onChange={handleChange}
                placeholder="Banco de Origen"
                required
                className="
          border-2 rounded-xl px-4 py-3 transition-all
          border-blue-200 hover:border-blue-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white text-gray-900
          dark:border-gray-600 dark:hover:border-gray-500
          dark:bg-gray-800 dark:text-gray-100
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
              />
            </div>

            {/* Número de Cuenta */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaCreditCard className="text-blue-600 dark:text-gray-200" />
                Número de Cuenta
              </label>
              <input
                type="text"
                name="numero_cuenta"
                value={formData.numero_cuenta}
                onChange={handleChange}
                placeholder="Número de Cuenta"
                required
                className="
          border-2 rounded-xl px-4 py-3 transition-all
          border-blue-200 hover:border-blue-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white text-gray-900
          dark:border-gray-600 dark:hover:border-gray-500
          dark:bg-gray-800 dark:text-gray-100
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
              />
            </div>

            {/* Tipo de Cuenta */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaCreditCard className="text-blue-600 dark:text-gray-200" />
                Tipo de Cuenta
              </label>
              <input
                type="text"
                name="tipo_cuenta"
                value={formData.tipo_cuenta}
                onChange={handleChange}
                placeholder="Tipo de Cuenta"
                required
                className="
          border-2 rounded-xl px-4 py-3 transition-all
          border-blue-200 hover:border-blue-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white text-gray-900
          dark:border-gray-600 dark:hover:border-gray-500
          dark:bg-gray-800 dark:text-gray-100
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
              />
            </div>

            {/* Titular de la Cuenta */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaUser className="text-blue-600 dark:text-gray-200" />
                Titular de la Cuenta
              </label>
              <input
                type="text"
                name="titular_cuenta"
                value={formData.titular_cuenta}
                onChange={handleChange}
                placeholder="Titular de la Cuenta"
                required
                className="
          border-2 rounded-xl px-4 py-3 transition-all
          border-blue-200 hover:border-blue-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white text-gray-900
          dark:border-gray-600 dark:hover:border-gray-500
          dark:bg-gray-800 dark:text-gray-100
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
              />
            </div>

            {/* Observación */}
            <div className="md:col-span-2 flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaFileAlt className="text-blue-600 dark:text-gray-200" />
                Observación
              </label>
              <textarea
                name="observacion"
                value={formData.observacion}
                onChange={handleChange}
                rows={4}
                placeholder="Observaciones adicionales (opcional)"
                className="
          border-2 rounded-xl px-4 py-3 transition-all resize-none
          border-blue-200 hover:border-blue-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white text-gray-900
          dark:border-gray-600 dark:hover:border-gray-500
          dark:bg-gray-800 dark:text-gray-100
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-8">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="
          flex-1 px-6 py-3 rounded-xl font-semibold shadow-sm transition-all hover:shadow
          bg-gray-200 hover:bg-gray-300 text-gray-700
          dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
        "
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
        flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-semibold shadow-lg transition-all hover:shadow-xl
        bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white
        disabled:opacity-50 disabled:cursor-not-allowed
        dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500
      "
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="text-xl" />
                  Guardar Dato Bancario
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Datos bancarios guardados con éxito"
      />

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default CrearDatosBancarios;
