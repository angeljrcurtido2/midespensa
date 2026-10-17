'use client';

import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { getMovimientoRRHHById, updateMovimientoRRHH } from '../../services/rrhh';

interface EditarMovimientoRRHHProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: '',
  tipo: 'bono' as 'bono' | 'descuento',
  concepto: '',
  monto: '',
  estado: 'activo' as 'activo' | 'anulado',
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

// Mismos colores que CrearMovimientoRRHH: verde para lo que suma, rojo para
// lo que resta. El desplegable original no daba esta señal antes de guardar.
const TIPOS = [
  {
    valor: 'bono' as const,
    label: 'Bono',
    ayuda: 'Suma al total a cobrar',
    activo: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    valor: 'descuento' as const,
    label: 'Descuento',
    ayuda: 'Resta del total a cobrar',
    activo: 'border-rose-600 bg-rose-50 dark:bg-rose-900/30',
    texto: 'text-rose-700 dark:text-rose-300',
  },
];

const ESTADOS = [
  {
    valor: 'activo' as const,
    label: 'Activo',
    ayuda: 'Se aplica en la próxima liquidación',
    activo: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    valor: 'anulado' as const,
    label: 'Anulado',
    ayuda: 'Queda registrado pero no se cobra ni descuenta',
    activo: 'border-gray-500 bg-gray-100 dark:bg-gray-700',
    texto: 'text-gray-700 dark:text-gray-300',
  },
];

const EditarMovimientoRRHH = ({ id, onSuccess, onClose }: EditarMovimientoRRHHProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCargando(true);

    getMovimientoRRHHById(id)
      .then((res) => {
        const raw = unwrapData<{
          fecha?: string;
          tipo?: 'bono' | 'descuento';
          concepto?: string;
          monto?: number | string;
          estado?: 'activo' | 'anulado';
        }>(res.data);

        setFormData({
          fecha: parseFechaToInput(raw.fecha),
          tipo: raw.tipo || 'bono',
          concepto: raw.concepto || '',
          monto: raw.monto !== undefined && raw.monto !== null ? String(raw.monto) : '',
          estado: raw.estado || 'activo',
        });
      })
      .catch((error) => {
        console.error('Error al obtener movimiento RRHH:', error);
        setErrorMessage('No se pudo cargar el movimiento');
        setErrorModalOpen(true);
      })
      .finally(() => setCargando(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fecha) {
      setErrorMessage('La fecha es obligatoria');
      setErrorModalOpen(true);
      return;
    }
    if (!formData.concepto.trim()) {
      setErrorMessage('El concepto es obligatorio');
      setErrorModalOpen(true);
      return;
    }
    const monto = Number(formData.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorMessage('El monto debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await updateMovimientoRRHH(id, {
        fecha: formData.fecha,
        tipo: formData.tipo,
        concepto: formData.concepto.trim(),
        monto,
        estado: formData.estado,
      });

      setSuccessModalOpen(true);
      onSuccess && onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar movimiento:', error);
      let message = 'Error al actualizar el movimiento';
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
    onClose && onClose();
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
        Editar movimiento
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Los movimientos anulados quedan registrados pero no impactan en la liquidación.
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
          <NumericFormat
            value={formData.monto}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, monto: values.value || '' }))
            }
            className={inputClass}
            prefix="Gs. "
            placeholder="Monto"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tipo de movimiento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipo: t.valor }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.tipo === t.valor
                    ? t.activo
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    formData.tipo === t.valor ? t.texto : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {t.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.ayuda}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Estado
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ESTADOS.map((es) => (
              <button
                key={es.valor}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, estado: es.valor }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.estado === es.valor
                    ? es.activo
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    formData.estado === es.valor ? es.texto : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {es.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{es.ayuda}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
          <input
            type="text"
            name="concepto"
            value={formData.concepto}
            onChange={handleChange}
            required
            className={inputClass}
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
        message="Movimiento actualizado con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarMovimientoRRHH;
