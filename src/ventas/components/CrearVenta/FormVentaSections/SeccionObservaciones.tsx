'use client';

import { type FC } from 'react';

interface Props {
  venta: any;
  setVenta: (data: any) => void;
}

const SeccionObservaciones: FC<Props> = ({ venta, setVenta }) => {
  return (
    <div className="dark:bg-slate-900 bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-200">
      <div data-venta-compact-header className="bg-blue-600 dark:bg-slate-800 p-4">
        <h3 className="text-base font-bold text-white">Observaciones</h3>
        <p className="text-sm font-medium text-blue-100">Información adicional de la venta</p>
      </div>
      <div data-venta-compact-body className="p-4">
        <label className="block text-sm text-gray-600 mb-1 font-semibold">Observación</label>
        <textarea
          placeholder="Observación (opcional)"
          value={venta.observacion}
          onChange={e => setVenta((prev: any) => ({ ...prev, observacion: e.target.value }))}
          className="w-full border-2 border-blue-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
        />
      </div>
    </div>
  );
};

export default SeccionObservaciones;
