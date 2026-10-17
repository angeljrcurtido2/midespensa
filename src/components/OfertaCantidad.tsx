import { infoOferta } from '../utils/oferta';

const gs = (n: number) => `₲ ${Math.round(n).toLocaleString('es-PY')}`;

/** Cartel de la oferta por cantidad en una línea de venta: qué hay, si ya se aplicó y cuánto falta. */
export default function OfertaCantidad({ d }: { d: any }) {
  const o = infoOferta(d);
  if (!o) return null;
  if (!o.conviene) {
    return <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">⚠ La oferta {o.n} por {gs(o.precio)} no conviene con el precio actual de la unidad.</p>;
  }
  if (o.combos > 0) {
    return (
      <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
        ✓ Oferta {o.n} por {gs(o.precio)} aplicada{o.combos > 1 ? ` ×${o.combos}` : ''}: −{gs(o.descuento)}
        {o.faltan > 0 && <span className="ml-1 font-semibold text-emerald-700"> · con {o.faltan} más completás otra</span>}
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
      💡 Oferta: {o.n} por {gs(o.precio)} ({gs(o.porUnidad)} c/u)
      {o.faltan > 0 ? ` · agregá ${o.faltan} más y ahorrás ${gs(o.ahorroPorCombo)}` : ` · llevando ${o.n} ahorrás ${gs(o.ahorroPorCombo)}`}
    </p>
  );
}
