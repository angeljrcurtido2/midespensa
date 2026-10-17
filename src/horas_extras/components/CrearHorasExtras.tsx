'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import {
  createHoraExtra,
  calcularHoraExtra,
  TIPOS_HORA_EXTRA,
  type CalculoHoraExtra,
  type Empleado,
} from '../../services/rrhh';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';

interface CrearHorasExtrasProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
  cantidad_horas: '',
  tipo: 'Diurna',
  observacion: '',
};

const formatGs = (n: number) =>
  Number.isFinite(n) ? `${Math.round(n).toLocaleString('es-PY')} Gs` : '--';

const CrearHorasExtras = ({ onSuccess, onClose }: CrearHorasExtrasProps) => {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [modalListarEmpleadoOpen, setModalListarEmpleadoOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // El monto lo calcula el backend con el salario vigente: replicarlo acá
  // llevaría a que la pantalla y lo que se guarda puedan diferir.
  const [calculo, setCalculo] = useState<CalculoHoraExtra | null>(null);
  const [avisoSalario, setAvisoSalario] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const recalcular = useCallback(async () => {
    const horas = Number(formData.cantidad_horas);
    if (!empleadoSeleccionado || !Number.isFinite(horas) || horas <= 0) {
      setCalculo(null);
      setAvisoSalario(null);
      return;
    }
    try {
      const { data } = await calcularHoraExtra({
        idempleado: empleadoSeleccionado.idempleado,
        cantidad_horas: horas,
        tipo: formData.tipo,
        fecha: formData.fecha,
      });
      setCalculo(data.data);
      setAvisoSalario(null);
    } catch (error: unknown) {
      setCalculo(null);
      // El motivo habitual es que el empleado no tiene salario vigente: se
      // avisa acá y no al guardar, que es cuando ya perdió el trabajo cargado.
      let msg = 'No se pudo calcular el monto';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { data?: { message?: string } } }).response;
        msg = r?.data?.message || msg;
      }
      setAvisoSalario(msg);
    }
  }, [empleadoSeleccionado, formData.cantidad_horas, formData.tipo, formData.fecha]);

  useEffect(() => {
    // Pequeño retardo para no pegarle al servidor en cada tecla.
    const t = setTimeout(recalcular, 350);
    return () => clearTimeout(t);
  }, [recalcular]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empleadoSeleccionado) {
      setErrorMessage('Debes seleccionar un empleado');
      setErrorModalOpen(true);
      return;
    }

    const cantidadHoras = Number(formData.cantidad_horas);
    if (!Number.isFinite(cantidadHoras) || cantidadHoras <= 0) {
      setErrorMessage('La cantidad de horas debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await createHoraExtra({
        idempleado: empleadoSeleccionado.idempleado,
        fecha: formData.fecha,
        cantidad_horas: cantidadHoras,
        tipo: formData.tipo,
        observacion: formData.observacion.trim() || null,
      });
      setSuccessModalOpen(true);
      setFormData(initialForm);
      setEmpleadoSeleccionado(null);
      setCalculo(null);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      let message = 'Error al registrar la hora extra';
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
        Registrar horas extras
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        El monto se calcula con el salario vigente y queda congelado a esta fecha.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Empleado
          </label>
          <div className="flex gap-2">
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
            placeholder="0"
            className={inputClass}
          />
        </div>

        {/* Antes era texto libre, lo que producía recargos inconsistentes. */}
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

        {/* Lo que se va a pagar, antes de guardar. */}
        {calculo && (
          <div className="md:col-span-2 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaClock className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                Monto a pagar
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
            placeholder="Ej: cierre de inventario, cobertura de turno"
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
            disabled={loading || !!avisoSalario}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar horas extras'}
          </button>
        </div>
      </form>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Horas extras registradas con éxito"
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

export default CrearHorasExtras;
