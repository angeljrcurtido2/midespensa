'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaRegClock } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import SelectorOpciones from '../../components/SelectorOpciones';
import { getAsistenciaById, updateAsistencia } from '../../services/rrhh';

interface EditarAsistenciaProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

type EstadoAsistencia = 'Presente' | 'Ausente' | 'Permiso' | 'Reposo';

// Mismo enum que CrearAsistencia; ver la nota ahí sobre por qué un valor
// distinto de estos cuatro se guardaba como cadena vacía en la tabla.
const ESTADOS: { valor: EstadoAsistencia; label: string; ayuda: string }[] = [
  { valor: 'Presente', label: 'Presente', ayuda: 'Cuenta como día trabajado' },
  { valor: 'Ausente', label: 'Ausente', ayuda: 'No se paga el día' },
  { valor: 'Permiso', label: 'Permiso', ayuda: 'Ausencia autorizada' },
  { valor: 'Reposo', label: 'Reposo', ayuda: 'Reposo médico' },
];

const initialForm = {
  fecha: '',
  hora_entrada: '',
  hora_salida: '',
  estado: 'Presente' as EstadoAsistencia,
  observacion: '',
};

const unwrapData = <T,>(payload: unknown): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const EditarAsistencia = ({ id, onSuccess, onClose }: EditarAsistenciaProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCargando(true);

    getAsistenciaById(id)
      .then((res) => {
        const raw = unwrapData<{
          fecha?: string;
          hora_entrada?: string | null;
          hora_salida?: string | null;
          estado?: string;
          observacion?: string | null;
        }>(res.data);

        // Un registro con un estado inválido de antes de la validación cae a
        // 'Presente' en vez de dejar el select en un valor que no existe entre
        // las opciones.
        const estadoValido = ESTADOS.some((e) => e.valor === raw.estado);

        setFormData({
          fecha: raw.fecha ? String(raw.fecha).slice(0, 10) : '',
          hora_entrada: raw.hora_entrada || '',
          hora_salida: raw.hora_salida || '',
          estado: estadoValido ? (raw.estado as EstadoAsistencia) : 'Presente',
          observacion: raw.observacion || '',
        });
      })
      .catch((error: unknown) => {
        console.error('Error al obtener asistencia:', error);
        setErrorMessage('No se pudo cargar la asistencia');
        setErrorModalOpen(true);
      })
      .finally(() => setCargando(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Igual que en CrearAsistencia: mostrar cuánto suma la jornada mientras se
  // edita, no sólo al cargarla por primera vez.
  const horasTrabajadas = useMemo(() => {
    const { hora_entrada: entrada, hora_salida: salida } = formData;
    if (!entrada || !salida) return null;
    const [he, me] = entrada.split(':').map(Number);
    const [hs, ms] = salida.split(':').map(Number);
    if ([he, me, hs, ms].some((n) => !Number.isFinite(n))) return null;
    let minutos = hs * 60 + ms - (he * 60 + me);
    if (minutos < 0) minutos += 24 * 60;
    return Math.round((minutos / 60) * 100) / 100;
  }, [formData.hora_entrada, formData.hora_salida]);

  const registraHoras = formData.estado === 'Presente';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateAsistencia(id, {
        fecha: formData.fecha,
        hora_entrada: formData.hora_entrada || null,
        hora_salida: formData.hora_salida || null,
        estado: formData.estado,
        observacion: formData.observacion || null,
      });
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar asistencia:', error);
      // El backend responde con `message` (estado inválido, no encontrada,
      // etc.), no con `error`: leer el campo equivocado dejaba estos avisos
      // sin llegar nunca a la pantalla.
      let message = 'Error al actualizar la asistencia';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { data?: { message?: string } } }).response;
        message = r?.data?.message || message;
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

  if (cargando) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
        Editar asistencia
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Los días presentes son los que se pagan en las modalidades por jornal y por hora.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Asistencia actualizada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarAsistencia;
