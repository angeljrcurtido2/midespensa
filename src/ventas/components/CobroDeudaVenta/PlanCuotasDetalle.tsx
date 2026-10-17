'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';
import { listarCuotasPorDeuda } from '../../../services/cuotas';
import { formatPY } from '../../../movimiento/utils/utils';

interface PlanCuotasDetalleProps {
  iddeuda: number;
  onCuotaSeleccionada?: (cuota: Cuota | null, montoParcial?: number) => void;
  modoSeleccion?: boolean;
}

interface Cuota {
  iddetalle_cuota: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota_total: number;
  monto_capital: number;
  monto_interes_normal: number;
  monto_interes_punitorio?: number;
  saldo_capital: number;
  saldo_interes: number;
  saldo_total: number;
  monto_pagado_capital?: number;
  monto_pagado_interes?: number;
  monto_pagado_punitorio?: number;
  estado: 'pendiente' | 'vencida' | 'pagada_parcial' | 'pagada_total';
}

interface Resumen {
  total_cuotas: number;
  cuotas_pendientes: number;
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  total_a_pagar: number;
  total_pagado: number;
}

const PlanCuotasDetalle: React.FC<PlanCuotasDetalleProps> = ({
  iddeuda,
  onCuotaSeleccionada,
  modoSeleccion = false
}) => {
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<number | null>(null);
  const [pagosParciales, setPagosParciales] = useState<{ [key: number]: number }>({});
  const [mostrarInputParcial, setMostrarInputParcial] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchCuotas = async () => {
      try {
        setLoading(true);
        const response = await listarCuotasPorDeuda(iddeuda);
        setCuotas(response.data.cuotas);
        setResumen(response.data.resumen);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar las cuotas');
        console.error('Error al obtener cuotas:', err);
      } finally {
        setLoading(false);
      }
    };

    if (iddeuda) {
      fetchCuotas();
    }
  }, [iddeuda]);

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'pagada_total':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-300 dark:border-green-700',
          text: 'text-green-700 dark:text-green-400',
          icon: <FaCheckCircle className="text-green-600 dark:text-green-400" size={16} />,
          label: 'Pagada'
        };
      case 'vencida':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          text: 'text-red-700 dark:text-red-400',
          icon: <FaExclamationTriangle className="text-red-600 dark:text-red-400" size={16} />,
          label: 'Vencida'
        };
      case 'pagada_parcial':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          text: 'text-yellow-700 dark:text-yellow-400',
          icon: <FaClock className="text-yellow-600 dark:text-yellow-400" size={16} />,
          label: 'Pago Parcial'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-300 dark:border-blue-700',
          text: 'text-blue-700 dark:text-blue-400',
          icon: <FaClock className="text-blue-600 dark:text-blue-400" size={16} />,
          label: 'Pendiente'
        };
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSeleccionarCuota = (cuota: Cuota) => {
    if (!modoSeleccion) return;

    const nuevaSeleccion = cuotaSeleccionada === cuota.iddetalle_cuota ? null : cuota.iddetalle_cuota;
    setCuotaSeleccionada(nuevaSeleccion);

    if (nuevaSeleccion === null) {
      onCuotaSeleccionada?.(null);
      setMostrarInputParcial({});
      setPagosParciales({});
    } else {
      const cuotaActual = cuotas.find(c => c.iddetalle_cuota === nuevaSeleccion);
      if (cuotaActual) {
        onCuotaSeleccionada?.(cuotaActual, undefined);
      }
    }
  };

  const handleTogglePagoParcial = (idCuota: number) => {
    setMostrarInputParcial(prev => ({
      ...prev,
      [idCuota]: !prev[idCuota]
    }));

    if (mostrarInputParcial[idCuota]) {
      // Si se está ocultando, limpiar el monto parcial
      setPagosParciales(prev => {
        const nuevo = { ...prev };
        delete nuevo[idCuota];
        return nuevo;
      });
      const cuotaActual = cuotas.find(c => c.iddetalle_cuota === idCuota);
      if (cuotaActual) {
        onCuotaSeleccionada?.(cuotaActual, undefined);
      }
    }
  };

  const handleMontoParcialChange = (idCuota: number, valor: string) => {
    const monto = parseFloat(valor) || 0;
    setPagosParciales(prev => ({
      ...prev,
      [idCuota]: monto
    }));

    const cuotaActual = cuotas.find(c => c.iddetalle_cuota === idCuota);
    if (cuotaActual) {
      onCuotaSeleccionada?.(cuotaActual, monto);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-400">
        <div className="flex items-center gap-2">
          <FaExclamationTriangle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!cuotas || cuotas.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center text-gray-600 dark:text-gray-300">
        <FaMoneyBillWave className="mx-auto mb-3 text-gray-400 dark:text-gray-500" size={32} />
        <p>Esta deuda no tiene plan de cuotas asociado.</p>
        <p className="text-sm mt-1">Es una venta a crédito simple (pago único).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {resumen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border-2 border-blue-200 dark:border-gray-600">
          <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <FaMoneyBillWave className="text-blue-600 dark:text-blue-400" />
            Resumen del Plan de Cuotas
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cuotas</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{resumen.total_cuotas}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pagadas</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{resumen.cuotas_pagadas}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{resumen.cuotas_pendientes}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Vencidas</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{resumen.cuotas_vencidas}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Cuotas */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 p-3">
          <h4 className="font-bold text-white flex items-center gap-2">
            <FaCalendarAlt />
            Detalle de Cuotas
          </h4>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
              <tr>
                {modoSeleccion && (
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Seleccionar</th>
                )}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Cuota</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Vencimiento</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Monto</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Capital</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Interés</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Mora</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Saldo</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                {modoSeleccion && (
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cuotas.map((cuota) => {
                const styles = getEstadoStyles(cuota.estado);
                const tieneInteresPunitorio = (cuota.monto_interes_punitorio || 0) > 0;
                const estaSeleccionada = cuotaSeleccionada === cuota.iddetalle_cuota;
                const mostrarParcial = mostrarInputParcial[cuota.iddetalle_cuota];
                const montoParcial = pagosParciales[cuota.iddetalle_cuota];
                const cuotaPendiente = cuota.estado === 'pendiente' || cuota.estado === 'vencida' || cuota.estado === 'pagada_parcial';

                return (
                  <>
                    <tr
                      key={cuota.iddetalle_cuota}
                      className={`${styles.bg} hover:opacity-80 transition-opacity ${estaSeleccionada ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                    >
                      {modoSeleccion && (
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={estaSeleccionada}
                            onChange={() => handleSeleccionarCuota(cuota)}
                            disabled={!cuotaPendiente}
                            className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-30 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3 font-semibold text-blue-700 dark:text-blue-400">
                        #{cuota.numero_cuota}
                      </td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {formatFecha(cuota.fecha_vencimiento)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-gray-800 dark:text-white">
                        {formatPY(cuota.monto_cuota_total)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                        {formatPY(cuota.monto_capital)}
                      </td>
                      <td className="px-3 py-3 text-right text-orange-600 dark:text-orange-400">
                        {formatPY(cuota.monto_interes_normal)}
                      </td>
                      <td className={`px-3 py-3 text-right ${tieneInteresPunitorio ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                        {tieneInteresPunitorio ? (
                          <>{formatPY(cuota.monto_interes_punitorio)}</>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                         {formatPY(cuota.saldo_total)}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full border ${styles.border} ${styles.text}`}>
                          {styles.icon}
                          <span className="text-xs font-semibold">{styles.label}</span>
                        </div>
                      </td>
                      {modoSeleccion && (
                        <td className="px-3 py-3 text-center">
                          {estaSeleccionada && cuotaPendiente && (
                            <button
                              onClick={() => handleTogglePagoParcial(cuota.iddetalle_cuota)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                mostrarParcial
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              {mostrarParcial ? 'Cancelar Parcial' : 'Pago Parcial'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    {/* Fila expandible para pago parcial */}
                    {estaSeleccionada && mostrarParcial && (
                      <tr key={`parcial-${cuota.iddetalle_cuota}`} className="bg-blue-50 dark:bg-blue-900/20">
                        <td colSpan={modoSeleccion ? 10 : 8} className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Monto del pago parcial:
                            </label>
                            <input
                              type="number"
                              value={montoParcial || ''}
                              onChange={(e) => handleMontoParcialChange(cuota.iddetalle_cuota, e.target.value)}
                              placeholder="Ingrese el monto"
                              min="0"
                              max={cuota.monto_cuota_total}
                              className="px-4 py-2 border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 w-64"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Máximo: ₲ {cuota.monto_cuota_total.toLocaleString('es-PY')}
                            </span>
                            {montoParcial && montoParcial > cuota.monto_cuota_total && (
                              <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                El monto no puede ser mayor al monto de la cuota
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">Información:</p>
        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <li><strong>Capital:</strong> Monto del préstamo que se está pagando</li>
          <li><strong>Interés:</strong> Interés normal acordado en el plan</li>
          <li><strong>Mora:</strong> Interés punitorio por pago tardío (solo si está vencida)</li>
          <li><strong>Saldo:</strong> Monto total pendiente de pago para esta cuota</li>
        </ul>
      </div>
    </div>
  );
};

export default PlanCuotasDetalle;