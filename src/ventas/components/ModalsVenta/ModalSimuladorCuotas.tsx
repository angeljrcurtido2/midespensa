'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import React from 'react';

interface ModalSimuladorCuotasProps {
  isOpen: boolean;
  onClose: () => void;
  monto_financiar: number;
  cant_cuota: number;
  tasa_interes_anual: number;
  dia_fecha_pago: number;
}

interface CuotaSimulada {
  nro_cuota: number;
  fecha_vencimiento: string;
  capital: number;
  interes: number;
  cuota_fija: number;
  saldo_restante: number;
}

const ModalSimuladorCuotas: React.FC<ModalSimuladorCuotasProps> = ({
  isOpen,
  onClose,
  monto_financiar,
  cant_cuota,
  tasa_interes_anual,
  dia_fecha_pago,
}) => {
  const [cuotas, setCuotas] = useState<CuotaSimulada[]>([]);
  const [metadata, setMetadata] = useState({
    cuota_fija: 0,
    total_a_pagar: 0,
    total_intereses: 0,
  });

  const calcularPlanCuotas = () => {
    if (monto_financiar <= 0 || cant_cuota <= 0 || tasa_interes_anual < 0) {
      setCuotas([]);
      return;
    }

    // Si es 1 cuota, es crédito simple (pago único)
    if (cant_cuota === 1) {
      const fechaVenc = new Date();
      fechaVenc.setMonth(fechaVenc.getMonth() + 1);
      fechaVenc.setDate(dia_fecha_pago);

      setCuotas([{
        nro_cuota: 1,
        fecha_vencimiento: fechaVenc.toLocaleDateString('es-PY'),
        capital: monto_financiar,
        interes: 0,
        cuota_fija: monto_financiar,
        saldo_restante: 0,
      }]);

      setMetadata({
        cuota_fija: monto_financiar,
        total_a_pagar: monto_financiar,
        total_intereses: 0,
      });
      return;
    }

    //   Sistema Francés - Cuotas fijas
    const tea = tasa_interes_anual / 100;
    const tem = Math.pow(1 + tea, 1 / 12) - 1; // Tasa efectiva mensual

    // Fórmula de cuota fija (Sistema Francés)
    let cuota_fija;
    if (tem === 0) {
      // Sin intereses, cuota = monto / cantidad
      cuota_fija = monto_financiar / cant_cuota;
    } else {
      cuota_fija = (monto_financiar * tem * Math.pow(1 + tem, cant_cuota)) /
        (Math.pow(1 + tem, cant_cuota) - 1);
    }

    const cuotasCalculadas: CuotaSimulada[] = [];
    let saldo_restante = monto_financiar;

    for (let i = 1; i <= cant_cuota; i++) {
      const interes = saldo_restante * tem;
      const capital = cuota_fija - interes;
      saldo_restante -= capital;

      // Calcular fecha de vencimiento
      const fechaVenc = new Date();
      fechaVenc.setMonth(fechaVenc.getMonth() + i);
      fechaVenc.setDate(dia_fecha_pago);

      // Ajustar si el mes no tiene ese día
      if (fechaVenc.getDate() !== dia_fecha_pago) {
        fechaVenc.setDate(0); // Último día del mes anterior
      }

      cuotasCalculadas.push({
        nro_cuota: i,
        fecha_vencimiento: fechaVenc.toLocaleDateString('es-PY'),
        capital: parseFloat(capital.toFixed(2)),
        interes: parseFloat(interes.toFixed(2)),
        cuota_fija: parseFloat(cuota_fija.toFixed(2)),
        saldo_restante: parseFloat(Math.max(0, saldo_restante).toFixed(2)),
      });
    }

    const total_a_pagar = cuota_fija * cant_cuota;
    const total_intereses = total_a_pagar - monto_financiar;

    setCuotas(cuotasCalculadas);
    setMetadata({
      cuota_fija: parseFloat(cuota_fija.toFixed(2)),
      total_a_pagar: parseFloat(total_a_pagar.toFixed(2)),
      total_intereses: parseFloat(total_intereses.toFixed(2)),
    });
  };

  useEffect(() => {
    if (isOpen) {
      calcularPlanCuotas();
    }
  }, [isOpen, monto_financiar, cant_cuota, tasa_interes_anual, dia_fecha_pago]);

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 " />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-blue-800 flex items-center gap-2"
                  >
                    Simulador de Plan de Cuotas
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                    onClick={onClose}
                  >
                    ×
                  </button>
                </div>

                {cuotas.length > 0 ? (
                  <div className="space-y-6">
                    {/* Resumen */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
                      <h4 className="font-bold text-lg text-gray-800 mb-4">Resumen del Crédito</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Monto a Financiar</p>
                          <p className="font-bold text-lg text-gray-800">
                            ₲ {monto_financiar.toLocaleString('es-PY')}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Cuota Fija Mensual</p>
                          <p className="font-bold text-lg text-blue-600">
                            ₲ {metadata.cuota_fija.toLocaleString('es-PY')}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Total a Pagar</p>
                          <p className="font-bold text-lg text-green-600">
                            ₲ {metadata.total_a_pagar.toLocaleString('es-PY')}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Total Intereses</p>
                          <p className="font-bold text-lg text-orange-600">
                            ₲ {metadata.total_intereses.toLocaleString('es-PY')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Cuotas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                        <h4 className="font-bold text-md text-gray-800">
                          Detalle de Cuotas ({cant_cuota} cuotas)
                        </h4>
                      </div>
                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-600 text-white sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Cuota</th>
                              <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
                              <th className="px-4 py-3 text-right font-semibold">Capital</th>
                              <th className="px-4 py-3 text-right font-semibold">Interés</th>
                              <th className="px-4 py-3 text-right font-semibold">Cuota</th>
                              <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {cuotas.map((cuota, index) => (
                              <tr
                                key={cuota.nro_cuota}
                                className={`hover:bg-blue-50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <td className="px-4 py-3 font-semibold text-blue-700">
                                  #{cuota.nro_cuota}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {cuota.fecha_vencimiento}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-800">
                                  ₲ {cuota.capital.toLocaleString('es-PY')}
                                </td>
                                <td className="px-4 py-3 text-right text-orange-600">
                                  ₲ {cuota.interes.toLocaleString('es-PY')}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-blue-600">
                                  ₲ {cuota.cuota_fija.toLocaleString('es-PY')}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                  ₲ {cuota.saldo_restante.toLocaleString('es-PY')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Nota informativa */}
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                       
                        <div>
                          <p className="text-sm text-yellow-800 font-semibold mb-1">
                            Información Importante
                          </p>
                          <p className="text-xs text-yellow-700">
                            Esta es una simulación del plan de cuotas. El plan definitivo se generará
                            automáticamente al confirmar la venta y se guardará en la base de datos.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón Cerrar */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition-colors"
                        onClick={onClose}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No se pudo calcular el plan de cuotas con los datos proporcionados.
                    </p>
                    <button
                      type="button"
                      className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
                      onClick={onClose}
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSimuladorCuotas;
