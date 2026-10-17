import type { FC } from 'react';

interface Props {
  total: number;
  cantidadLineas: number;
}

/** Panel fijo a la derecha de Nueva compra: el total siempre a la vista y el botón principal. */
const PanelTotalCompra: FC<Props> = ({ total, cantidadLineas }) => (
  <section aria-label="Total de la compra" className="overflow-hidden rounded-xl border-2 border-blue-600 bg-white shadow-md dark:bg-slate-900">
    <div className="bg-blue-700 px-4 py-3 text-white">
      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Total de la compra</p>
      <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight" aria-live="polite">Gs. {Math.round(total).toLocaleString('es-PY')}</p>
      <p className="mt-1 text-xs text-blue-100">{cantidadLineas === 0 ? 'Sin productos todavía' : `${cantidadLineas} producto${cantidadLineas === 1 ? '' : 's'}`}</p>
    </div>
    <div className="p-3">
      <button
        type="submit"
        disabled={cantidadLineas === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white shadow hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Registrar compra
        <kbd className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">F9</kbd>
      </button>
    </div>
  </section>
);

export default PanelTotalCompra;
