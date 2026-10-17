'use client';

import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { getComisionById, updateComision } from '../../services/rrhh';

interface EditarComisionesProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: '',
  monto_venta: '',
  porcentaje: '',
  referencia: '',
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

  const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;

  return '';
};

const EditarComisiones = ({ id, onSuccess, onClose }: EditarComisionesProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCargando(true);

    getComisionById(id)
      .then((res) => {
        const raw = unwrapData<{
          fecha?: string;
          monto_venta?: number | string;
          porcentaje?: number | string;
          referencia?: string | null;
        }>(res.data);

        setFormData({
          fecha: parseFechaToInput(raw.fecha),
          monto_venta:
            raw.monto_venta !== undefined && raw.monto_venta !== null
              ? String(raw.monto_venta)
              : '',
          porcentaje:
            raw.porcentaje !== undefined && raw.porcentaje !== null
              ? String(raw.porcentaje)
              : '',
          referencia: raw.referencia || '',
        });
      })
      .catch((error: unknown) => {
        console.error('Error al obtener comision:', error);
        setErrorMessage('No se pudo cargar la comisión');
        setErrorModalOpen(true);
      })
      .finally(() => setCargando(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoVenta = Number(formData.monto_venta);
    const porcentaje = Number(formData.porcentaje);
    const montoComision = (montoVenta * porcentaje) / 100;

    if (!Number.isFinite(montoVenta) || montoVenta <= 0) {
      setErrorMessage('El monto de venta debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    if (!Number.isFinite(porcentaje) || porcentaje <= 0) {
      setErrorMessage('El porcentaje debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await updateComision(id, {
        fecha: formData.fecha,
        monto_venta: montoVenta,
        porcentaje,
        monto_comision: Number(montoComision.toFixed(2)),
        referencia: formData.referencia.trim() || null,
      });
      setSuccessModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar comision:', error);
      // El backend responde con `message` ("Comision no encontrada", etc.);
      // el catch anterior leía `error`, que el backend nunca manda acá.
      let message = 'Error al actualizar la comisión';
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
        Editar comisión
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        El monto de la comisión se recalcula con el nuevo porcentaje.
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
            Monto venta
          </label>
          <NumericFormat
            value={formData.monto_venta}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, monto_venta: values.value || '' }))
            }
            className={inputClass}
            prefix="Gs. "
            placeholder="Monto venta"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Porcentaje
          </label>
          <NumericFormat
            value={formData.porcentaje}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, porcentaje: values.value || '' }))
            }
            className={inputClass}
            suffix="%"
            placeholder="Porcentaje"
            required
          />
        </div>

        {/* Mismo cálculo en vivo que en el alta: se ve el resultado antes de
            confirmar el cambio, no recién en el listado. */}
        {Number(formData.monto_venta) > 0 && Number(formData.porcentaje) > 0 && (
          <div className="md:col-span-2 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(Number(formData.monto_venta)).toLocaleString('es-PY')} Gs
                  {' x '}
                  {formData.porcentaje}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Comisión a pagar</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(
                  (Number(formData.monto_venta) * Number(formData.porcentaje)) / 100,
                ).toLocaleString('es-PY')}{' '}
                Gs
              </p>
            </div>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Referencia <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            name="referencia"
            value={formData.referencia}
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
        message="Comisión actualizada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarComisiones;
