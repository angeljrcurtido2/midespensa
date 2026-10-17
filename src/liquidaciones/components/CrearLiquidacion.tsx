'use client';

import { useState } from 'react';
import { FaFilePdf, FaCalculator, FaCheckCircle } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import {
  createLiquidacion,
  preLiquidacion,
  preLiquidacionPDF,
  TIPOS_LIQUIDACION,
  type Empleado,
  type Liquidacion,
  type TipoLiquidacion,
} from '../../services/rrhh';
import ModalListarEmpleado from '../../empleados/components/ModalsEmpleados/ModalListarEmpleado';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';

interface CrearLiquidacionProps {
  onSuccess?: () => void;
  onClose?: () => void;
  idEmpleadoInicial?: number | string | null;
}

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const formatGs = (v: number | string | null | undefined) => {
  const n = toNumber(v);
  return `${Math.round(n).toLocaleString('es-PY')} Gs`;
};

const formatFecha = (fecha?: string) => {
  if (!fecha) return 'N/A';
  const value = String(fecha);
  const onlyDate = value.includes('T') ? value.slice(0, 10) : value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) {
    const [y, m, d] = onlyDate.split('-');
    return `${d}-${m}-${y}`;
  }
  return onlyDate;
};

const mensajeError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return r?.data?.message || r?.data?.error || fallback;
  }
  return fallback;
};

const CrearLiquidacion = ({ onSuccess, onClose, idEmpleadoInicial }: CrearLiquidacionProps) => {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(
    idEmpleadoInicial ? ({ idempleado: Number(idEmpleadoInicial) } as Empleado) : null,
  );
  const [modalListarEmpleadoOpen, setModalListarEmpleadoOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoLiquidacion>('Normal');
  // Vacías = el backend deduce el período (desde la última liquidación a hoy).
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [preview, setPreview] = useState<Liquidacion | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const payloadBase = () => ({
    idempleado: Number(empleadoSeleccionado?.idempleado),
    tipo,
    ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
    ...(fechaFin ? { fecha_fin: fechaFin } : {}),
  });

  const validar = () => {
    if (!empleadoSeleccionado?.idempleado) {
      setErrorMessage('Debes seleccionar un empleado');
      setErrorModalOpen(true);
      return false;
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      setErrorMessage('La fecha fin no puede ser anterior a la fecha inicio');
      setErrorModalOpen(true);
      return false;
    }
    return true;
  };

  const handlePreLiquidacion = async () => {
    if (!validar()) return;
    setLoadingPreview(true);
    try {
      const res = await preLiquidacion(payloadBase());
      setPreview(res.data.data || null);
    } catch (error: unknown) {
      console.error(error);
      setPreview(null);
      setErrorMessage(mensajeError(error, 'Error al generar la pre liquidación'));
      setErrorModalOpen(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerar = async () => {
    if (!validar()) return;
    setLoadingGenerate(true);
    try {
      await createLiquidacion(payloadBase());
      setSuccessModalOpen(true);
      setPreview(null);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      setErrorMessage(mensajeError(error, 'Error al generar la liquidación'));
      setErrorModalOpen(true);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handlePDF = async () => {
    if (!validar()) return;
    setLoadingPDF(true);
    try {
      const res = await preLiquidacionPDF(payloadBase());
      const base64 = res.data?.reportePDFBase64;
      if (!base64) throw new Error('sin pdf');
      descargarPdfBase64(base64, `preliquidacion-${fechaParaNombreArchivo()}.pdf`);
    } catch (error: unknown) {
      console.error(error);
      setErrorMessage(mensajeError(error, 'Error al generar el PDF'));
      setErrorModalOpen(true);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (onClose) onClose();
  };

  const inputClass =
    'border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-all w-full';

  // Filas del recibo. Se arman desde el preview para que lo que se ve en
  // pantalla sea exactamente lo que devolvió el cálculo del servidor.
  const filas = preview
    ? [
        {
          label: preview.desglose?.remuneracion_detalle || 'Remuneración del período',
          valor: preview.desglose?.remuneracion_monto ?? preview.salario_base,
          signo: '+' as const,
        },
        { label: 'Horas extras', valor: preview.total_horas_extras, signo: '+' as const },
        { label: 'Comisiones', valor: preview.total_comisiones, signo: '+' as const },
        ...(preview.desglose?.conceptos || []).map((c) => ({
          label: c.concepto,
          valor: c.monto,
          signo: (c.tipo === 'Descuento' ? '-' : '+') as '+' | '-',
        })),
        { label: 'Bonos', valor: preview.total_bonos, signo: '+' as const },
        { label: 'Descuentos', valor: preview.total_descuentos, signo: '-' as const },
        {
          label: `IPS (${preview.desglose?.porcentaje_ips ?? 0}% sobre ${formatGs(preview.desglose?.base_imponible_ips)})`,
          valor: preview.total_ips,
          signo: '-' as const,
        },
      ].filter((f) => toNumber(f.valor) !== 0)
    : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">Nueva liquidación</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Calculá primero para revisar el detalle, y recién después generá la liquidación.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Empleado
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={
                empleadoSeleccionado?.nombre
                  ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido || ''} - ${empleadoSeleccionado.cedula || 'sin documento'}`
                  : empleadoSeleccionado?.idempleado
                    ? `Empleado #${empleadoSeleccionado.idempleado}`
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tipo de liquidación
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {TIPOS_LIQUIDACION.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => {
                  setTipo(t.valor);
                  setPreview(null);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  tipo === t.valor
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    tipo === t.valor
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {t.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.ayuda}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Desde <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value);
              setPreview(null);
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hasta <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="date"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={(e) => {
              setFechaFin(e.target.value);
              setPreview(null);
            }}
            className={inputClass}
          />
        </div>

        <p className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Si dejás las fechas vacías, se toma desde la última liquidación hasta hoy.
        </p>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePreLiquidacion}
            disabled={loadingPreview}
            className="flex-1 min-w-[160px] py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaCalculator />
            {loadingPreview ? 'Calculando...' : 'Calcular'}
          </button>
          <button
            type="button"
            onClick={handlePDF}
            disabled={loadingPDF}
            className="flex-1 min-w-[160px] py-2.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaFilePdf />
            {loadingPDF ? 'Generando...' : 'Ver PDF'}
          </button>
        </div>

        {/* Recibo: cada línea explica de dónde sale el total. */}
        {preview && (
          <div className="md:col-span-2 rounded-xl border-2 border-blue-100 dark:border-blue-900/40 overflow-hidden">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Período {formatFecha(preview.fecha_inicio)} al {formatFecha(preview.fecha_fin)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {preview.desglose?.dias_periodo ?? 0} días
                  {preview.modalidad ? ` · modalidad ${preview.modalidad}` : ''}
                  {preview.desglose?.dias_presentes
                    ? ` · ${preview.desglose.dias_presentes} días presentes`
                    : ''}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-medium">
                {tipo}
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filas.map((f) => (
                <div key={f.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                  <span
                    className={`text-sm font-semibold ${
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
                <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                  No hay conceptos para este período
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-100">Total a cobrar</span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {formatGs(preview.total_a_cobrar)}
              </span>
            </div>
          </div>
        )}

        <div className="md:col-span-2 flex gap-3 mt-1">
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
            type="button"
            onClick={handleGenerar}
            disabled={loadingGenerate || !preview}
            title={!preview ? 'Calculá primero para revisar el detalle' : undefined}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {loadingGenerate ? 'Generando...' : 'Generar liquidación'}
          </button>
        </div>
      </div>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Liquidación generada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
      <ModalListarEmpleado
        isOpen={modalListarEmpleadoOpen}
        onClose={() => setModalListarEmpleadoOpen(false)}
        onSelect={(empleado) => {
          setEmpleadoSeleccionado(empleado);
          setPreview(null);
        }}
      />
    </div>
  );
};

export default CrearLiquidacion;
