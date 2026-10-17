'use client';

import { useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { createAmonestacion, type Empleado } from '../../services/rrhh';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';

interface CrearAmonestacionesProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
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

const CrearAmonestaciones = ({ onSuccess, onClose }: CrearAmonestacionesProps) => {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [modalListarEmpleadoOpen, setModalListarEmpleadoOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empleadoSeleccionado) {
      setErrorMessage('  Debes seleccionar un empleado');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const tipoNormalizado = normalizeTipo(formData.tipo) || 'Verbal';

      await createAmonestacion({
        idempleado: empleadoSeleccionado.idempleado,
        fecha: formData.fecha,
        tipo: tipoNormalizado,
        motivo: formData.motivo || null,
      });

      setSuccessModalOpen(true);
      setFormData(initialForm);
      setEmpleadoSeleccionado(null);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      let message = 'Error al crear amonestacion';
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
          Crear Amonestacion
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Empleado</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={
                  empleadoSeleccionado
                    ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido} - ${empleadoSeleccionado.cedula || 'sin documento'}`
                    : 'Sin empleado seleccionado'
                }
                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
              />
              <button
                type="button"
                onClick={() => setModalListarEmpleadoOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Seleccionar
              </button>
            </div>
          </div>

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
              {loading ? 'Guardando...' : 'Guardar Amonestacion'}
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Amonestacion creada con exito" />
      <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />

      <ModalListarEmpleado
        isOpen={modalListarEmpleadoOpen}
        onClose={() => setModalListarEmpleadoOpen(false)}
        onSelect={(empleado) => setEmpleadoSeleccionado(empleado)}
      />
    </div>
  );
};

export default CrearAmonestaciones;
