'use client';

import { useState } from 'react';
import { NumericFormat } from 'react-number-format';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { createComision, type Empleado } from '../../services/rrhh';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';

interface CrearComisionesProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

const initialForm = {
    fecha: new Date().toISOString().slice(0, 10),
    monto_venta: '',
    porcentaje: '',
    referencia: '',
};

const CrearComisiones = ({ onSuccess, onClose }: CrearComisionesProps) => {
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

        const montoVenta = Number(formData.monto_venta);
        const porcentaje = Number(formData.porcentaje);
        const montoComision = (montoVenta * porcentaje) / 100;

        if (!Number.isFinite(montoVenta) || montoVenta <= 0) {
            setErrorMessage('  El monto de venta debe ser mayor a 0');
            setErrorModalOpen(true);
            return;
        }

        if (!Number.isFinite(porcentaje) || porcentaje <= 0) {
            setErrorMessage('  El porcentaje debe ser mayor a 0');
            setErrorModalOpen(true);
            return;
        }

        if (!Number.isFinite(montoComision) || montoComision <= 0) {
            setErrorMessage('  El monto de comision calculado es invalido');
            setErrorModalOpen(true);
            return;
        }

        setLoading(true);
        try {
            await createComision({
                idempleado: empleadoSeleccionado.idempleado,
                fecha: formData.fecha,
                monto_venta: montoVenta,
                porcentaje,
                monto_comision: Number(montoComision.toFixed(2)),
                referencia: formData.referencia.trim() || null,
            });

            setSuccessModalOpen(true);
            setFormData(initialForm);
            setEmpleadoSeleccionado(null);
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            console.error(error);
            let message = 'Error al crear comision';
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
                    Crear Comision
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
                        <label className="text-sm text-gray-700 dark:text-gray-300">Monto venta</label>
                        <NumericFormat
                            value={formData.monto_venta}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={0}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            allowLeadingZeros={false}
                            onValueChange={(values) =>
                                setFormData((prev) => ({ ...prev, monto_venta: values.value || '' }))
                            }
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
                            prefix="Gs. "
                            placeholder="Monto venta"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Porcentaje</label>
                        <NumericFormat
                            value={formData.porcentaje}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            allowLeadingZeros={false}
                            onValueChange={(values) =>
                                setFormData((prev) => ({ ...prev, porcentaje: values.value || '' }))
                            }
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2"
                            suffix="%"
                            placeholder="Porcentaje"
                            required
                        />
                    </div>

                    {/* El monto de la comisión se calculaba en silencio y el
                        usuario recién lo veía en el listado; mostrarlo acá deja
                        verificar el porcentaje antes de guardar. */}
                    {Number(formData.monto_venta) > 0 && Number(formData.porcentaje) > 0 && (
                        <div className="md:col-span-2 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {Math.round(Number(formData.monto_venta)).toLocaleString('es-PY')} Gs
                                        {' x '}{formData.porcentaje}%
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Comisión a pagar
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {Math.round(
                                        (Number(formData.monto_venta) * Number(formData.porcentaje)) / 100,
                                    ).toLocaleString('es-PY')} Gs
                                </p>
                            </div>
                        </div>
                    )}

                    <textarea
                        name="referencia"
                        value={formData.referencia}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Referencia"
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
                            {loading ? 'Guardando...' : 'Guardar Comision'}
                        </button>
                    </div>
                </form>
            </div>

            <ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Comision creada con exito" />
            <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />

            <ModalListarEmpleado
                isOpen={modalListarEmpleadoOpen}
                onClose={() => setModalListarEmpleadoOpen(false)}
                onSelect={(empleado) => setEmpleadoSeleccionado(empleado)}
            />
        </div>
    );
};

export default CrearComisiones;
