'use client';

import { useEffect, useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import { FaSave, FaUniversity, FaCreditCard, FaUser, FaFileAlt } from 'react-icons/fa';
import { getDatosBancariosById, updateDatosBancarios } from '../../services/datosBancarios';

interface EditarDatosBancariosProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  banco_origen: '',
  numero_cuenta: '',
  tipo_cuenta: '',
  titular_cuenta: '',
  observacion: '',
};

const EditarDatosBancarios = ({ id, onSuccess, onClose }: EditarDatosBancariosProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getDatosBancariosById(id).then((res) => {
        setFormData(res.data);
      }).catch(err => {
        console.error('Error al obtener dato bancario', err);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDatosBancarios(id, formData);
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al actualizar dato bancario', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-3 rounded-xl">
              <FaUniversity className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Editar Dato Bancario</h2>
              <p className="text-blue-100 text-sm">Actualiza la información de la cuenta</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUniversity className="text-blue-600" />
                Banco de Origen
              </label>
              <input
                type="text"
                name="banco_origen"
                value={formData.banco_origen}
                onChange={handleChange}
                className="border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                placeholder="Banco de Origen"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaCreditCard className="text-blue-600" />
                Número de Cuenta
              </label>
              <input
                type="text"
                name="numero_cuenta"
                value={formData.numero_cuenta}
                onChange={handleChange}
                className="border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                placeholder="Número de Cuenta"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaCreditCard className="text-blue-600" />
                Tipo de Cuenta
              </label>
              <input
                type="text"
                name="tipo_cuenta"
                value={formData.tipo_cuenta}
                onChange={handleChange}
                className="border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                placeholder="Tipo de Cuenta"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Titular de la Cuenta
              </label>
              <input
                type="text"
                name="titular_cuenta"
                value={formData.titular_cuenta}
                onChange={handleChange}
                className="border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                placeholder="Titular de la Cuenta"
                required
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaFileAlt className="text-blue-600" />
                Observación
              </label>
              <textarea
                name="observacion"
                value={formData.observacion}
                onChange={handleChange}
                rows={4}
                className="border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 resize-none"
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-8">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl transition-all text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="text-xl" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Dato bancario actualizado con éxito"
      />
    </div>
  );
};

export default EditarDatosBancarios;
