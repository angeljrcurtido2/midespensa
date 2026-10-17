import { useState, type FC } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaCheckCircle } from 'react-icons/fa';

interface Props {
  subtotal: number;
  descuento: number;
  recargo: number;
  cantidadLineas: number;
  /** Texto del botón principal (en el listado de ventas se llama "Registrar venta"). */
  textoBoton?: string;
}

const gs = (n: number) => `${Math.round(n).toLocaleString('es-PY')}`;

/** Panel de cobro fijo a la derecha: el total siempre a la vista, cuánto recibió el cliente, el vuelto y el botón principal. */
const PanelCobroVenta: FC<Props> = ({ subtotal, descuento, recargo, cantidadLineas, textoBoton = 'Registrar venta' }) => {
  const [recibido, setRecibido] = useState(0);
  const total = Math.max(0, subtotal - descuento + recargo);
  const vuelto = recibido - total;
  const hayRecibido = recibido > 0;

  return (
    <section aria-label="Resumen y cobro" className="overflow-hidden rounded-xl border-2 border-emerald-500 bg-white shadow-md dark:bg-slate-900">
      <div className="bg-emerald-600 px-5 py-4 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Total a cobrar</p>
        <p className="mt-1 text-4xl font-extrabold leading-none tracking-tight" aria-live="polite">Gs. {gs(total)}</p>
        <p className="mt-2 text-sm text-emerald-100">{cantidadLineas === 0 ? 'Sin productos todavía' : `${cantidadLineas} producto${cantidadLineas === 1 ? '' : 's'}`}</p>
      </div>

      <dl className="space-y-1.5 px-5 py-3 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-semibold">Gs. {gs(subtotal)}</dd></div>
        {descuento > 0 && <div className="flex justify-between text-red-600"><dt>Descuento y ofertas</dt><dd className="font-semibold">− Gs. {gs(descuento)}</dd></div>}
        {recargo > 0 && <div className="flex justify-between text-blue-700"><dt>Recargo</dt><dd className="font-semibold">+ Gs. {gs(recargo)}</dd></div>}
      </dl>

      <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-700">
        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Recibido
          <NumericFormat
            value={recibido || ''}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={0}
            allowNegative={false}
            placeholder="0"
            onValueChange={(v) => setRecibido(v.floatValue || 0)}
            className="w-44 rounded-lg border-2 border-blue-300 px-3 py-2 text-right text-lg font-bold focus:border-blue-600 focus:outline-none dark:bg-slate-800"
          />
        </label>
        {hayRecibido && (
          <p className={`mt-2 flex items-center justify-end gap-2 text-sm font-bold ${vuelto >= 0 ? 'text-emerald-700' : 'text-red-600'}`} role="status">
            {vuelto >= 0 && <FaCheckCircle aria-hidden="true" />}
            {vuelto > 0 ? `Vuelto: Gs. ${gs(vuelto)}` : vuelto === 0 ? 'Pago exacto' : `Faltan: Gs. ${gs(-vuelto)}`}
          </p>
        )}
      </div>

      <div className="px-5 pb-5">
        <button
          type="submit"
          disabled={cantidadLineas === 0}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-extrabold text-white shadow hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {textoBoton}
          <kbd className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">F9</kbd>
        </button>
      </div>
    </section>
  );
};

export default PanelCobroVenta;
