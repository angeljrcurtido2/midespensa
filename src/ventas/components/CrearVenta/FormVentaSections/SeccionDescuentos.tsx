'use client';

import { type FC } from 'react';
import TipoDescuentoSelect, { type TipoAjusteVenta } from '../TipoDescuento';

interface Props {
  tipoDescuento: TipoAjusteVenta;
  setTipoDescuento: (tipo: TipoAjusteVenta) => void;
  montoDescuentoTotal: string;
  setMontoDescuentoTotal: (value: string) => void;
  montoRecargoTotal: string;
  setMontoRecargoTotal: (value: string) => void;
}

const SeccionDescuentos: FC<Props> = ({ tipoDescuento, setTipoDescuento, montoDescuentoTotal, setMontoDescuentoTotal, montoRecargoTotal, setMontoRecargoTotal }) => {
  const esRecargo = tipoDescuento.startsWith('recargo_');
  const esGeneral = tipoDescuento.endsWith('_total');
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border-2 border-blue-100 dark:border-slate-700">
      <div data-venta-compact-header className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-slate-700 dark:to-slate-800 p-4">
        <h3 className="text-base font-bold text-white">Descuentos y recargos</h3>
        <p className="text-sm font-medium text-blue-100 dark:text-slate-300">Configure ajustes generales o por producto</p>
      </div>
      <div data-venta-compact-body>
        <TipoDescuentoSelect value={tipoDescuento} className='pb-3 pl-3' onSelectionChange={setTipoDescuento} setMontoDescuentoTotal={setMontoDescuentoTotal} setMontoRecargoTotal={setMontoRecargoTotal} />
        {esGeneral && (
          <div className="p-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-semibold">Ingrese monto de {esRecargo ? 'recargo' : 'descuento'}</label>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder={`Ingrese monto de ${esRecargo ? 'recargo' : 'descuento'}`}
              value={esRecargo ? montoRecargoTotal : montoDescuentoTotal}
              onChange={e => (esRecargo ? setMontoRecargoTotal(e.target.value) : setMontoDescuentoTotal(e.target.value))}
              className="w-auto border-2 border-blue-300 dark:border-slate-600 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SeccionDescuentos;
