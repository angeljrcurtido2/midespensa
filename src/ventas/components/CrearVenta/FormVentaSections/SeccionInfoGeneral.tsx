'use client';

import { type FC } from 'react';

interface Props {
  venta: any;
  setVenta: (data: any) => void;
  clienteSeleccionado: any;
  openClienteModal: () => void;
}

const SeccionInfoGeneral: FC<Props> = ({ venta, setVenta, clienteSeleccionado, openClienteModal }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border-2 border-blue-100 dark:border-slate-700">
      <div data-venta-compact-header className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-slate-700 dark:to-slate-800 p-4">
        <h3 className="text-base font-bold text-white">Información General</h3>
        <p className="text-sm font-medium text-blue-100 dark:text-slate-300">Datos principales de la venta</p>
      </div>
      <div data-venta-compact-body className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seleccionar Cliente */}
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Cliente opcional</label>
          <button
            type="button"
            onClick={openClienteModal}
            className="w-full border-2 border-blue-300 dark:border-slate-600 px-4 py-2 rounded-lg text-left bg-blue-50 dark:bg-slate-800 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
          >
            {clienteSeleccionado?.nombre ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : 'Seleccionar cliente (opcional)'}
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Si no selecciona cliente, la venta se registrará a nombre de UNIVERSAL.
          </p>
        </div>

        {/* Fecha de Venta */}
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Fecha de Venta</label>
          <input
            type="date"
            required
            value={venta.fecha}
            onChange={e => setVenta((prev: any) => ({ ...prev, fecha: e.target.value }))}
            className="w-full border-2 border-gray-300 dark:border-slate-600 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de Venta */}
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Tipo de Venta</label>
          <select
            value={venta.tipo}
            onChange={e => setVenta((prev: any) => ({ ...prev, tipo: e.target.value }))}
            className="w-full border-2 border-gray-300 dark:border-slate-600 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>

        {/* Tipo de Comprobante */}
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Tipo de Comprobante</label>
          <select
            value={venta.tipo_comprobante || 'T'}
            disabled
            className="w-full border-2 border-gray-300 dark:border-slate-600 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-70"
            required
          >
            <option value="T">Ticket</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SeccionInfoGeneral;
