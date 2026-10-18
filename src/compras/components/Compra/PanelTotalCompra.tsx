import type { FC } from 'react';

interface Props {
  total: number;
  cantidadLineas: number;
}

/** Remito de compra: papel crema con borde punteado, el total siempre a la vista y el botón principal. */
const PanelTotalCompra: FC<Props> = ({ total, cantidadLineas }) => (
  <section aria-label="Total de la compra" className="rounded-3xl border-2 border-dashed border-stone-400 bg-amber-50 p-5 text-stone-800 shadow-sm dark:bg-stone-800 dark:text-stone-100">
    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-500">Remito de compra</p>
    <p className="mt-2 font-mono text-3xl font-black leading-none tracking-tight text-stone-900 dark:text-amber-300" aria-live="polite">
      Gs. {Math.round(total).toLocaleString('es-PY')}
    </p>
    <p className="mt-1 text-xs text-stone-500">{cantidadLineas === 0 ? 'Todavía no cargaste mercadería' : `${cantidadLineas} producto${cantidadLineas === 1 ? '' : 's'} en el remito`}</p>
    <button
      type="submit"
      disabled={cantidadLineas === 0}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-800 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
    >
      Registrar compra
      <kbd className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold normal-case">F9</kbd>
    </button>
  </section>
);

export default PanelTotalCompra;
