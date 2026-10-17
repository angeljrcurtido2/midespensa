'use client';

import { useEffect, useState } from 'react';
import ModalError from '../../components/ModalError';
import { getLiquidacionById, type Liquidacion } from '../../services/rrhh';
import { formatGs } from '../../salarios/utils/calculoSalario';

interface EditarLiquidacionProps {
  id: number | string;
  onClose?: () => void;
}

// Este panel es de sólo lectura a propósito: una liquidación ya generada es
// el resultado de un cálculo (salario vigente, asistencias, horas extras del
// período) y editar sus totales a mano los desconectaría de los datos que los
// originaron. Para corregir algo se anula y se vuelve a generar.
const unwrapData = <T,>(payload: unknown): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const formatFecha = (fecha?: string | null) => {
  if (!fecha) return 'N/A';
  const value = String(fecha);
  const onlyDate = value.includes('T') ? value.slice(0, 10) : value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) {
    const [y, m, d] = onlyDate.split('-');
    return `${d}-${m}-${y}`;
  }
  return onlyDate;
};

const getEstadoColor = (estado?: string) => {
  switch (estado) {
    case 'Pagado':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'Anulado':
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  }
};

const EditarLiquidacion = ({ id, onClose }: EditarLiquidacionProps) => {
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setCargando(true);

    getLiquidacionById(id)
      .then((res) => {
        setLiquidacion(unwrapData<Liquidacion>(res.data));
      })
      .catch((error: unknown) => {
        console.error('Error al obtener liquidacion:', error);
        setErrorMessage('No se pudo cargar la liquidación');
        setErrorModalOpen(true);
      })
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!liquidacion) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No se encontró la liquidación.
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
          >
            Cerrar
          </button>
        )}
        <ModalError
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          message={errorMessage}
        />
      </div>
    );
  }

  // Mismo desglose que la tarjeta del listado: cada concepto con monto, con
  // signo, y sólo los que efectivamente aportan algo al total.
  const filas = [
    { label: 'Remuneración', valor: liquidacion.salario_base, signo: '+' as const },
    { label: 'Horas extras', valor: liquidacion.total_horas_extras, signo: '+' as const },
    { label: 'Comisiones', valor: liquidacion.total_comisiones, signo: '+' as const },
    { label: 'Aguinaldo / vacaciones', valor: liquidacion.total_asignaciones, signo: '+' as const },
    { label: 'Bonos', valor: liquidacion.total_bonos, signo: '+' as const },
    { label: 'Descuentos', valor: liquidacion.total_descuentos, signo: '-' as const },
    { label: 'IPS', valor: liquidacion.total_ips, signo: '-' as const },
  ].filter((f) => toNumber(f.valor) !== 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {liquidacion.nombre} {liquidacion.apellido}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {liquidacion.cedula ? `Doc: ${liquidacion.cedula} · ` : ''}
            Liquidación #{liquidacion.idliquidacion}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getEstadoColor(liquidacion.estado)}`}
        >
          {liquidacion.estado}
        </span>
      </div>

      <div className="rounded-lg p-3 border-2 border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 my-4">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total a cobrar</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFecha(liquidacion.fecha_inicio)} al {formatFecha(liquidacion.fecha_fin)}
              {liquidacion.modalidad ? ` · ${liquidacion.modalidad}` : ''}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
            {formatGs(liquidacion.total_a_cobrar)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {filas.map((f) => (
          <div key={f.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">{f.label}</span>
            <span
              className={`font-semibold ${
                f.signo === '+'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {f.signo} {formatGs(f.valor)}
            </span>
          </div>
        ))}
        {filas.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            Sin conceptos adicionales.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {liquidacion.tipo || 'Normal'}
          </p>
        </div>
        {liquidacion.unidades_trabajadas != null && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">Unidades trabajadas</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {liquidacion.unidades_trabajadas}
            </p>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
        >
          Cerrar
        </button>
      )}

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarLiquidacion;
