'use client';

import { useEffect, useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { getAmonestacionById, updateAmonestacion } from '../../services/rrhh';

interface EditarAmonestacionesProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: '',
  tipo: 'Verbal',
  motivo: '',
};

// Devuelve el valor tal cual lo espera el ENUM de la tabla. La versión
// anterior pasaba todo a minúsculas ("Verbal" -> "verbal"), que MySQL guardaba
// como cadena vacía sin dar error: por eso había amonestaciones sin tipo.
const TIPOS_VALIDOS = ['Verbal', 'Escrita', 'Suspension'] as const;

const normalizeTipo = (tipo: string) => {
  const limpio = (tipo || '').trim().toLowerCase();
  return TIPOS_VALIDOS.find((t) => t.toLowerCase() === limpio) || '';
};

const parseFechaToInput = (fecha?: string) => {
  if (!fecha) return '';
  const value = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;

  return '';
};

const unwrapData = <T,>(payload: unknown): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const EditarAmonestaciones = ({ id, onSuccess, onClose }: EditarAmonestacionesProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    getAmonestacionById(id)
      .then((res) => {
        const raw = unwrapData<{ fecha?: string; tipo?: string; motivo?: string | null }>(res.data);
        setFormData({
          fecha: parseFechaToInput(raw.fecha),
          tipo: normalizeTipo(raw.tipo || 'Verbal') || 'Verbal',
          motivo: raw.motivo || '',
        });
      })
      .catch((error: unknown) => {
        console.error('Error al obtener amonestacion:', error);
        setErrorMessage('  No se pudo cargar la amonestacion');
        setErrorModalOpen(true);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tipoNormalizado = normalizeTipo(formData.tipo) || 'Verbal';

      await updateAmonestacion(id, {
        fecha: formData.fecha,
        tipo: tipoNormalizado,
        motivo: formData.motivo || null,
      });
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar amonestacion:', error);
      let message = 'Error al actualizar amonestacion';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object'
      ) {
        const response = (error as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) message = response.data.error;
      }
      setErrorMessage('  ' + message);
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="flex items-center justify-center px-4 border border-blue-300 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full">
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
          Editar Amonestacion
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700 dark:text-gray-300">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700 dark:text-gray-300">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
            >
              {/* Valores del enum de la tabla ("Verbal","Escrita",
                  "Suspension"). Se enviaban en minúscula y MySQL los
                  guardaba como cadena vacía sin avisar. */}
              <option value="Verbal">Verbal</option>
              <option value="Escrita">Escrita</option>
              <option value="Suspension">Suspensión</option>
            </select>
          </div>

          <textarea
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            rows={4}
            placeholder="Motivo de la amonestacion"
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 md:col-span-2 resize-none"
          />

          <div className="md:col-span-2 flex gap-3 mt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Amonestacion actualizada con exito" />
      <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />
    </div>
  );
};

export default EditarAmonestaciones;
