'use client';

import { useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';
import { createMovimientoRRHH, type Empleado } from '../../services/rrhh';

interface CrearMovimientoRRHHProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
  tipo: 'bono' as 'bono' | 'descuento',
  concepto: '',
  monto: '',
};

const CrearMovimientoRRHH = ({ onSuccess, onClose }: CrearMovimientoRRHHProps) => {
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

    if (!formData.fecha) {
      setErrorMessage('  La fecha es obligatoria');
      setErrorModalOpen(true);
      return;
    }

    if (!formData.concepto.trim()) {
      setErrorMessage('  El concepto es obligatorio');
      setErrorModalOpen(true);
      return;
    }

    const monto = Number(formData.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorMessage('  El monto debe ser mayor a 0');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await createMovimientoRRHH({
        idempleado: empleadoSeleccionado.idempleado,
        fecha: formData.fecha,
        tipo: formData.tipo,
        concepto: formData.concepto.trim(),
        monto,
        estado: 'activo',
      });

      setSuccessModalOpen(true);
      setFormData(initialForm);
      setEmpleadoSeleccionado(null);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.message || 'Error al crear movimiento';
      setErrorMessage('  ' + message);
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose && onClose();
  };

  return (
    <div className="flex items-center justify-center px-4 border border-blue-300 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full">
        <h2 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">
          Crear Movimiento RRHH
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
                    ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido} - ${
                        empleadoSeleccionado.cedula || 'sin documento'
                      }`
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

          {/* Bono suma y descuento resta en la liquidación: el color y la ayuda
              hacen evidente el signo antes de guardar, en vez de dejarlo
              escondido en un desplegable. */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { valor: 'bono' as const, label: 'Bono', ayuda: 'Suma al total a cobrar', activo: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', texto: 'text-emerald-700 dark:text-emerald-300' },
                { valor: 'descuento' as const, label: 'Descuento', ayuda: 'Resta del total a cobrar', activo: 'border-rose-600 bg-rose-50 dark:bg-rose-900/30', texto: 'text-rose-700 dark:text-rose-300' },
              ].map((t) => (
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

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm text-gray-700 dark:text-gray-300">Concepto</label>
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
              placeholder="Ej: Bono por desempeño / Descuento por atraso"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm text-gray-700 dark:text-gray-300">Monto</label>
            <input
              type="number"
              name="monto"
              min="0.01"
              step="0.01"
              value={formData.monto}
              onChange={handleChange}
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
            />
          </div>

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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Movimiento creado con exito" />
      <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />

      <ModalListarEmpleado
        isOpen={modalListarEmpleadoOpen}
        onClose={() => setModalListarEmpleadoOpen(false)}
        onSelect={(empleado) => setEmpleadoSeleccionado(empleado)}
      />
    </div>
  );
};

export default CrearMovimientoRRHH;
