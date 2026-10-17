'use client';

import { type FC } from 'react';

interface Props {
  venta: any;
  setVenta: (data: any) => void;
  totalVenta: number;
  openSimuladorCuotas?: () => void;
}

const SeccionPlanCuotas: FC<Props> = ({ venta, setVenta, totalVenta, openSimuladorCuotas }) => {
  if (venta.tipo !== 'credito') return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-purple-100">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
        <h3 className="text-base font-bold text-white">Plan de Cuotas</h3>
        <p className="text-sm font-medium text-purple-100">Configure el plan de financiamiento</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cantidad de Cuotas */}
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-semibold">Cant. de Cuotas</label>
            <input
              type="number"
              min="1"
              max="60"
              value={venta.cant_cuota || 1}
              onChange={e => setVenta((prev: any) => ({ ...prev, cant_cuota: Number(e.target.value) }))}
              className="w-full border-2 border-purple-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: 6"
            />
            <p className="text-xs text-gray-500 mt-1">1 = Pago único, &gt;1 = Plan de cuotas</p>
          </div>

          {/* Tasa de Interés Anual */}
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-semibold">Interés Anual (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={venta.tasa_interes_anual || 0}
              onChange={e => setVenta((prev: any) => ({ ...prev, tasa_interes_anual: Number(e.target.value) }))}
              className="w-full border-2 border-purple-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: 36.00"
            />
            <p className="text-xs text-gray-500 mt-1">TEA (Tasa Efectiva Anual) en %</p>
          </div>

          {/* Día de Pago */}
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-semibold">Día de Pago</label>
            <input
              type="number"
              min="1"
              max="31"
              value={venta.dia_fecha_pago || 15}
              onChange={e => setVenta((prev: any) => ({ ...prev, dia_fecha_pago: Number(e.target.value) }))}
              className="w-full border-2 border-purple-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: 15"
            />
            <p className="text-xs text-gray-500 mt-1">Día del mes para vencimiento (1-31)</p>
          </div>
        </div>

        {/* Botón Simular Plan de Cuotas */}
        {venta.cant_cuota > 1 && venta.tasa_interes_anual >= 0 && totalVenta > 0  && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={openSimuladorCuotas}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 font-semibold text-sm"
            >
              Simular Plan de Cuotas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeccionPlanCuotas;
