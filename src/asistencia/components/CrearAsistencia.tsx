'use client';

import { useMemo, useState } from 'react';
import { FaRegClock } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import SelectorOpciones from '../../components/SelectorOpciones';
import { createAsistencia, type Empleado } from '../../services/rrhh';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';

interface CrearAsistenciaProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

type EstadoAsistencia = 'Presente' | 'Ausente' | 'Permiso' | 'Reposo';

// Deben coincidir con el enum de la tabla ('Presente','Ausente','Permiso',
// 'Reposo'). Antes el formulario enviaba minúsculas y un "tardanza" inexistente
// que MySQL guardaba como cadena vacía: una asistencia sin estado no cuenta
// como día trabajado y un jornalero terminaba cobrando de menos.
const ESTADOS: { valor: EstadoAsistencia; label: string; ayuda: string }[] = [
  { valor: 'Presente', label: 'Presente', ayuda: 'Cuenta como día trabajado' },
  { valor: 'Ausente', label: 'Ausente', ayuda: 'No se paga el día' },
  { valor: 'Permiso', label: 'Permiso', ayuda: 'Ausencia autorizada' },
  { valor: 'Reposo', label: 'Reposo', ayuda: 'Reposo médico' },
];

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
  hora_entrada: '',
  hora_salida: '',
  estado: 'Presente' as EstadoAsistencia,
  observacion: '',
};

const CrearAsistencia = ({ onSuccess, onClose }: CrearAsistenciaProps) => {
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

  // Las horas trabajadas son la base del pago por hora, así que conviene que el
  // usuario las vea al cargar y no recién en la liquidación.
  const horasTrabajadas = useMemo(() => {
    const { hora_entrada: entrada, hora_salida: salida } = formData;
    if (!entrada || !salida) return null;
    const [he, me] = entrada.split(':').map(Number);
    const [hs, ms] = salida.split(':').map(Number);
    if ([he, me, hs, ms].some((n) => !Number.isFinite(n))) return null;
    let minutos = hs * 60 + ms - (he * 60 + me);
    // Turno que cruza la medianoche.
    if (minutos < 0) minutos += 24 * 60;
    return Math.round((minutos / 60) * 100) / 100;
  }, [formData.hora_entrada, formData.hora_salida]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empleadoSeleccionado) {
      setErrorMessage('Debes seleccionar un empleado');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await createAsistencia({
        idempleado: empleadoSeleccionado.idempleado,
        fecha: formData.fecha,
        hora_entrada: formData.hora_entrada || null,
        hora_salida: formData.hora_salida || null,
        estado: formData.estado,
        observacion: formData.observacion || null,
      });

      setSuccessModalOpen(true);
      setFormData(initialForm);
      setEmpleadoSeleccionado(null);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      let message = 'Error al registrar la asistencia';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { data?: { message?: string; error?: string } } }).response;
        message = r?.data?.message || r?.data?.error || message;
      }
      setErrorMessage(message);
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (onClose) onClose();
  };

  const inputClass =
    'border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-all';

  const registraHoras = formData.estado === 'Presente';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
        Registrar asistencia
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Los días presentes son los que se pagan en las modalidades por jornal y por hora.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Empleado
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              readOnly
              value={
                empleadoSeleccionado
                  ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido} - ${empleadoSeleccionado.cedula || 'sin documento'}`
                  : 'Sin empleado seleccionado'
              }
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => setModalListarEmpleadoOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
            >
              Seleccionar
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <SelectorOpciones
            label="Estado"
            opciones={ESTADOS}
            valor={formData.estado}
            onChange={(estado) => setFormData((prev) => ({ ...prev, estado }))}
            columnas={4}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        {registraHoras && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora entrada
              </label>
              <input
                type="time"
                name="hora_entrada"
                value={formData.hora_entrada}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora salida
              </label>
              <input
                type="time"
                name="hora_salida"
                value={formData.hora_salida}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {horasTrabajadas !== null && (
              <div className="md:col-span-2 rounded-xl border-2 border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 p-4 flex items-center gap-3">
                <FaRegClock className="text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-bold">{horasTrabajadas} horas</span> trabajadas en la
                  jornada.
                </p>
              </div>
            )}
          </>
        )}

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Observación <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            name="observacion"
            value={formData.observacion}
            onChange={handleChange}
            rows={2}
            placeholder="Ej: llegó tarde por consulta médica"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="md:col-span-2 flex gap-3 mt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar asistencia'}
          </button>
        </div>
      </form>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Asistencia registrada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
      <ModalListarEmpleado
        isOpen={modalListarEmpleadoOpen}
        onClose={() => setModalListarEmpleadoOpen(false)}
        onSelect={(empleado) => setEmpleadoSeleccionado(empleado)}
      />
    </div>
  );
};

export default CrearAsistencia;
