import { useEffect, useRef, useState, type FC } from 'react';
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

/** Ticket de almacén: el total siempre a la vista, cuánto recibió el cliente, el vuelto y el botón de cobrar. */
const PanelCobroVenta: FC<Props> = ({ subtotal, descuento, recargo, cantidadLineas, textoBoton = 'Cobrar' }) => {
  const [recibido, setRecibido] = useState(0);
  const total = Math.max(0, subtotal - descuento + recargo);
  const vuelto = recibido - total;
  const hayRecibido = recibido > 0;

  // En el celular el ticket queda debajo de los productos: mientras no se lo ve, una barra fija muestra el total y lleva hasta él.
  const ticket = useRef<HTMLElement>(null);
  const [ticketVisible, setTicketVisible] = useState(true);
  useEffect(() => {
    const el = ticket.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(([e]) => setTicketVisible(e.isIntersecting), { threshold: 0.35 });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <section ref={ticket} aria-label="Ticket de la venta" className="relative scroll-mt-24 rounded-3xl bg-stone-900 text-stone-100 shadow-lg">
      {/* Borde de ticket */}
      <div aria-hidden="true" className="absolute -top-2 inset-x-4 h-3"
        style={{ backgroundImage: 'radial-gradient(circle at 8px 0, transparent 7px, #1c1917 8px)', backgroundSize: '16px 12px', backgroundRepeat: 'repeat-x' }} />

      <div className="px-6 pt-7 pb-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-300">Ticket de venta</p>
        <p className="mt-3 text-xs uppercase tracking-widest text-stone-400">Total a cobrar</p>
        <p className="mt-1 font-mono text-4xl font-extrabold leading-none tracking-tight text-amber-300" aria-live="polite">
          Gs. {gs(total)}
        </p>
        <p className="mt-2 text-sm text-stone-400">
          {cantidadLineas === 0 ? 'Todavía no cargaste productos' : `${cantidadLineas} producto${cantidadLineas === 1 ? '' : 's'} en el ticket`}
        </p>
      </div>

      <dl className="mx-6 space-y-1.5 border-y-2 border-dashed border-stone-700 py-3 font-mono text-sm">
        <div className="flex justify-between"><dt className="text-stone-400">Subtotal</dt><dd>Gs. {gs(subtotal)}</dd></div>
        {descuento > 0 && <div className="flex justify-between text-rose-300"><dt>Descuento y ofertas</dt><dd>− Gs. {gs(descuento)}</dd></div>}
        {recargo > 0 && <div className="flex justify-between text-sky-300"><dt>Recargo</dt><dd>+ Gs. {gs(recargo)}</dd></div>}
      </dl>

      <div className="px-6 py-4">
        <label className="flex items-center justify-between gap-3 text-sm font-bold text-stone-200">
          Recibido
          <NumericFormat
            value={recibido || ''}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={0}
            allowNegative={false}
            placeholder="0"
            onValueChange={(v) => setRecibido(v.floatValue || 0)}
            className="w-44 rounded-2xl !border-stone-600 !bg-stone-800 px-3 py-2 text-right font-mono text-lg font-bold !text-white focus:!border-amber-400"
          />
        </label>
        {hayRecibido && (
          <p className={`mt-2 flex items-center justify-end gap-2 text-sm font-bold ${vuelto >= 0 ? 'text-emerald-300' : 'text-rose-300'}`} role="status">
            {vuelto >= 0 && <FaCheckCircle aria-hidden="true" />}
            {vuelto > 0 ? `Vuelto: Gs. ${gs(vuelto)}` : vuelto === 0 ? 'Pago exacto' : `Faltan: Gs. ${gs(-vuelto)}`}
          </p>
        )}
      </div>

      <div className="px-6 pb-6">
        <button
          type="submit"
          disabled={cantidadLineas === 0}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-orange-500 px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-white hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400"
        >
          {textoBoton}
          <kbd className="rounded-md bg-black/25 px-2 py-0.5 text-xs font-semibold normal-case">F9</kbd>
        </button>
      </div>

      {cantidadLineas > 0 && !ticketVisible && (
        <div className="fixed inset-x-3 bottom-[4.6rem] z-20 lg:hidden">
          <button
            type="button"
            onClick={() => ticket.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex w-full items-center justify-between gap-3 rounded-full bg-orange-600 px-5 py-3.5 text-left text-white shadow-xl shadow-orange-900/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
          >
            <span className="text-sm font-bold">{cantidadLineas} {cantidadLineas === 1 ? 'producto' : 'productos'} · ir a cobrar</span>
            <span className="font-mono text-lg font-extrabold">Gs. {gs(total)}</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default PanelCobroVenta;
