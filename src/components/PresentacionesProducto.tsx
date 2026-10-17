import { FaBox, FaCube, FaBoxOpen } from 'react-icons/fa';

interface Props {
  producto: {
    unidad_medida?: string | null;
    cant_p_caja?: number | string | null;
    cant_p_pack?: number | string | null;
    precio_venta?: number | string | null;
    precio_venta_caja?: number | string | null;
    precio_venta_pack?: number | string | null;
  };
}

const gs = (v: unknown) => (Number(v) > 0 ? Number(v).toLocaleString('es-PY') : null);

/**
 * Cómo se vende el producto, en una línea de etiquetas: Unidad, Pack / blíster y Caja, cada una con
 * cuántas unidades trae y su precio. Si solo se vende por unidad muestra únicamente «Unidad».
 */
export default function PresentacionesProducto({ producto: p }: Props) {
  const esCaja = String(p.unidad_medida || '').toUpperCase() === 'CAJA' && Number(p.cant_p_caja) > 0;
  const hayPack = Number(p.cant_p_pack) > 0;
  const unidad = String(p.unidad_medida || '').toUpperCase();
  if (!esCaja && !hayPack) return null;
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold';
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5" aria-label="Presentaciones de venta">
      {!esCaja && <span className={`${base} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200`}><FaBoxOpen aria-hidden="true" /> {unidad === 'CAJA' ? 'Unidad' : unidad.charAt(0) + unidad.slice(1).toLowerCase()}{gs(p.precio_venta) ? ` · ${gs(p.precio_venta)}` : ''}</span>}
      {hayPack && <span className={`${base} bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200`} title="Pack / blíster / paquete"><FaCube aria-hidden="true" /> Pack/blíster x{Number(p.cant_p_pack)}{gs(p.precio_venta_pack) ? ` · ${gs(p.precio_venta_pack)}` : ''}</span>}
      {esCaja && <span className={`${base} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200`} title="Caja"><FaBox aria-hidden="true" /> Caja x{Number(p.cant_p_caja)}{gs(p.precio_venta_caja) ? ` · ${gs(p.precio_venta_caja)}` : ''}</span>}
    </p>
  );
}
