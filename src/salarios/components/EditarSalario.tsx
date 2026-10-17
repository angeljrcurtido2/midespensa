'use client';

import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import {
  getSalarioById,
  updateSalario,
  MODALIDADES,
  type ModalidadSalario,
  type Salario,
} from '../../services/rrhh';
import VistaPreviaSalario from './VistaPreviaSalario';

interface EditarSalarioProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  salario_base: '',
  modalidad: 'Mensual' as ModalidadSalario,
  jornada_horas: '8',
  dias_mes: '30',
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
};

const unwrapData = <T,>(payload: unknown): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const EditarSalario = ({ id, onSuccess, onClose }: EditarSalarioProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    getSalarioById(id)
      .then((res) => {
        const raw = unwrapData<Partial<Salario>>(res.data);
        setFormData({
          salario_base: String(raw?.salario_base ?? ''),
          // Los salarios cargados antes de la migración no traen modalidad;
          // 'Mensual' es el comportamiento que tenían implícitamente.
          modalidad: (raw?.modalidad as ModalidadSalario) || 'Mensual',
          jornada_horas: String(raw?.jornada_horas ?? 8),
          dias_mes: String(raw?.dias_mes ?? 30),
          fecha_inicio: raw?.fecha_inicio ? String(raw.fecha_inicio).slice(0, 10) : '',
          fecha_fin: raw?.fecha_fin ? String(raw.fecha_fin).slice(0, 10) : '',
          motivo: raw?.motivo || '',
        });
      })
      .catch((error: unknown) => {
        console.error('Error al obtener salario:', error);
        setErrorMessage('No se pudo cargar el salario');
        setErrorModalOpen(true);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number(formData.salario_base)) {
      setErrorMessage('El salario base debe ser mayor a cero');
      setErrorModalOpen(true);
      return;
    }
    if (formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
      setErrorMessage('La fecha fin no puede ser anterior a la fecha inicio');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      // Se envía la modalidad junto al resto: omitirla dejaría el salario con
      // la configuración anterior y el monto nuevo, una combinación que liquida
      // mal sin dar ninguna señal.
      await updateSalario(id, {
        salario_base: Number(formData.salario_base),
        modalidad: formData.modalidad,
        jornada_horas: Number(formData.jornada_horas) || 8,
        dias_mes: Number(formData.dias_mes) || 30,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin || null,
        motivo: formData.motivo || null,
      });
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar salario:', error);
      let message = 'Error al actualizar salario';
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">Editar salario</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Los cambios afectan a las liquidaciones que se generen de ahora en más.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Modalidad de pago
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODALIDADES.map((m) => (
              <button
                key={m.valor}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, modalidad: m.valor }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.modalidad === m.valor
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    formData.modalidad === m.valor
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {m.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.ayuda}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formData.modalidad === 'Hora' ? 'Monto por hora'
              : formData.modalidad === 'Jornal' ? 'Monto por día'
                : formData.modalidad === 'Quincenal' ? 'Monto por quincena'
                  : 'Sueldo mensual'}
          </label>
          <NumericFormat
            value={formData.salario_base}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={0}
            allowNegative={false}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, salario_base: values.value || '' }))
            }
            className={inputClass}
            prefix="Gs. "
            placeholder="0"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Horas por jornada
          </label>
          <input
            type="number"
            name="jornada_horas"
            min="1"
            max="24"
            step="0.5"
            value={formData.jornada_horas}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {formData.modalidad === 'Mensual' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Días por mes
            </label>
            <input
              type="number"
              name="dias_mes"
              min="1"
              max="31"
              value={formData.dias_mes}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha inicio</label>
          <input
            type="date"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha fin <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="date"
            name="fecha_fin"
            value={formData.fecha_fin}
            min={formData.fecha_inicio || undefined}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <VistaPreviaSalario
            salarioBase={formData.salario_base}
            modalidad={formData.modalidad}
            jornadaHoras={formData.jornada_horas}
            diasMes={formData.dias_mes}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            name="motivo"
            value={formData.motivo}
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
        message="Salario actualizado con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarSalario;
