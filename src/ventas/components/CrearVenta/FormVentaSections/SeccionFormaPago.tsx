'use client';

import { type FC } from 'react';

interface Props {
  venta: any;
  setVenta: (data: any) => void;
  formasPago: any[];
  setModalSeleccionarOpen: (value: boolean) => void;
  setModalChequeOpen: (value: boolean) => void;
  setModalTarjetaOpen: (value: boolean) => void;
}

const SeccionFormaPago: FC<Props> = ({
  venta,
  setVenta,
  formasPago,
  setModalSeleccionarOpen,
  setModalChequeOpen,
  setModalTarjetaOpen
}) => {
  if (venta.tipo !== 'contado') return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border-2 border-blue-100 dark:border-slate-700">
      <div data-venta-compact-header className="bg-blue-500 rounded-t-xl dark:bg-slate-800 p-4">
        <h3 className="text-base font-bold text-white">Forma de Pago</h3>
        <p className="text-sm font-medium text-blue-100">Seleccione el método de pago</p>
      </div>
      <div data-venta-compact-body className="p-4 space-y-4">
        <div>
          <label  className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Forma de Pago</label>
          <select
            value={venta.idformapago || ''}
            onChange={e =>
              setVenta((prev: any) => ({
                ...prev,
                idformapago: Number(e.target.value),
              }))
            }
            className="w-full border-2 border-gray-300 dark:border-slate-600 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Seleccione una forma de pago --</option>
            {formasPago.map((forma) => (
              <option key={forma.idformapago} value={forma.idformapago}>
                {forma.descripcion}
              </option>
            ))}
          </select>
        </div>

        {/* Botones adicionales según forma de pago */}
        {venta.idformapago === 2 && (
          <button
            type="button"
            onClick={() => setModalSeleccionarOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Seleccionar Datos Bancarios
          </button>
        )}

        {venta.idformapago === 3 && (
          <button
            type="button"
            onClick={() => setModalChequeOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Ingresar Datos del Cheque
          </button>
        )}

        {venta.idformapago === 4 && (
          <button
            type="button"
            onClick={() => setModalTarjetaOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Ingresar Datos Tarjeta C/D
          </button>
        )}
      </div>
    </div>
  );
};

export default SeccionFormaPago;
