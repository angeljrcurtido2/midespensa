'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import {
  getHoraExtraById,
  updateHoraExtra,
  calcularHoraExtra,
  TIPOS_HORA_EXTRA,
  type CalculoHoraExtra,
} from '../../services/rrhh';

interface EditarHorasExtrasProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  idempleado: 0,
  fecha: '',
  cantidad_horas: '',
  tipo: 'Diurna',
  observacion: '',
};

const unwrapData = <T,>(payload: unknown): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const parseFechaToInput = (fecha?: string) => {
  if (!fecha) return '';
  const value = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value.includes('T')) return value.slice(0, 10);

  const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;

  return '';
};

const formatGs = (n: number) =>
  Number.isFinite(n) ? `${Math.round(n).toLocaleString('es-PY')} Gs` : '--';

const EditarHorasExtras = ({ id, onSuccess, onClose }: EditarHorasExtrasProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculo, setCalculo] = useState<CalculoHoraExtra | null>(null);
  const [avisoSalario, setAvisoSalario] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    getHoraExtraById(id)
      .then((res) => {
        const raw = unwrapData<{
          idempleado?: number;
          fecha?: string;
          cantidad_horas?: number | string;
          tipo?: string | null;
          observacion?: string | null;
        }>(res.data);

        setFormData({
          idempleado: Number(raw?.idempleado ?? 0),
          fecha: parseFechaToInput(raw?.fecha),
          cantidad_horas:
            raw?.cantidad_horas !== undefined && raw?.cantidad_horas !== null
              ? String(raw.cantidad_horas)
              : '',
          // Los registros viejos pueden traer un tipo libre que no coincide con
          // ninguna opción; se cae a Diurna para que el select tenga un valor.
          tipo: TIPOS_HORA_EXTRA.some((t) => t.valor === raw?.tipo)
            ? String(raw?.tipo)
            : 'Diurna',
          observacion: raw?.observacion || '',
        });
      })
      .catch((error: unknown) => {
        console.error('Error al obtener hora extra:', error);
        setErrorMessage('No se pudo cargar la hora extra');
        setErrorModalOpen(true);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Al editar también se revaloriza: cambiar las horas sin actualizar el monto
  // dejaría el registro mostrando una cifra que no se corresponde con el dato.
  const recalcular = useCallback(async () => {
    const horas = Number(formData.cantidad_horas);
    if (!formData.idempleado || !Number.isFinite(horas) || horas <= 0 || !formData.fecha) {
      setCalculo(null);
      return;
    }
    try {
      const { data } = await calcularHoraExtra({
        idempleado: formData.idempleado,
        cantidad_horas: horas,
        tipo: formData.tipo,
        fecha: formData.fecha,
      });
      setCalculo(data.data);
      setAvisoSalario(null);
    } catch (error: unknown) {
      setCalculo(null);
      let msg = 'No se pudo calcular el monto';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { data?: { message?: string } } }).response;
        msg = r?.data?.message || msg;
      }
      setAvisoSalario(msg);
    }
  }, [formData.idempleado, formData.cantidad_horas, formData.tipo, formData.fecha]);

  useEffect(() => {
    const t = setTimeout(recalcular, 350);
    return () => clearTimeout(t);
  }, [recalcular]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cantidadHoras = Number(formData.cantidad_horas);
    if (!Number.isFinite(cantidadHoras) || cantidadHoras <= 0) {
      setErrorMessage('La cantidad de horas debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await updateHoraExtra(id, {
        fecha: formData.fecha,
        cantidad_horas: cantidadHoras,
        tipo: formData.tipo,
        observacion: formData.observacion.trim() || null,
      });
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar hora extra:', error);
      let message = 'Error al actualizar la hora extra';
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
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
        Editar horas extras
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        El monto se recalcula con el salario vigente a la fecha del registro.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cantidad de horas
          </label>
          <input
            type="number"
            name="cantidad_horas"
            min="0.5"
            step="0.5"
            value={formData.cantidad_horas}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tipo de hora extra
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIPOS_HORA_EXTRA.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipo: t.valor }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.tipo === t.valor
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    formData.tipo === t.valor
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {t.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+{t.recargo}%</p>
              </button>
            ))}
          </div>
        </div>

        {calculo && (
          <div className="md:col-span-2 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaClock className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                Nuevo monto
              </h3>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid grid-cols-3 gap-3 flex-1 min-w-[260px]">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor hora</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {formatGs(calculo.valor_hora_normal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Con recargo</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {formatGs(calculo.valor_hora)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Horas</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {calculo.cantidad_horas}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatGs(calculo.monto)}
                </p>
              </div>
            </div>
          </div>
        )}

        {avisoSalario && (
          <div className="md:col-span-2 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">{avisoSalario}</p>
          </div>
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
        message="Hora extra actualizada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarHorasExtras;
