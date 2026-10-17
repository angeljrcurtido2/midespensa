import type { FC } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';

const TotalCompra: FC<{ total: number }> = ({ total }) => {
  return (
    // Barra compacta en una sola línea. Antes era un bloque de 270px de alto para
    // mostrar un único número: en pantallas de 720px empujaba el formulario hacia
    // abajo y los botones de acción quedaban fuera de vista.
    <div className="w-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm flex items-center justify-between gap-4 flex-wrap">

      <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2 shrink-0">
        <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
          <FaMoneyBillWave size={14} />
        </span>
        Resumen de Compra
      </h3>

      <p className="text-xs text-gray-600 dark:text-slate-400 hidden md:block">
        Tipo de operación:{' '}
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          Compra de productos
        </span>
      </p>

      <div className="flex items-center gap-3 bg-blue-50 dark:bg-slate-800 rounded-lg px-4 py-1.5 border-2 border-blue-200 dark:border-slate-700">
        <span className="text-sm text-blue-700 dark:text-slate-300 font-semibold">
          Total de Compra
        </span>
        <span className="text-xl font-bold text-blue-700 dark:text-slate-100">
          {total.toLocaleString("es-PY")} Gs.
        </span>
      </div>
    </div>
  );
};

export default TotalCompra;
