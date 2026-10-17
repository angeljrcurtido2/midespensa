import { FaCheckCircle, FaExclamationTriangle, FaExternalLinkAlt, FaPlus } from 'react-icons/fa';
import type { TarjetaProducto } from '../../services/asistente';

const gs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;
const ETIQUETA_VENTA: Record<string, string> = { caja: 'Pack (caja)', blister: 'Blíster', unidad: 'Unidad suelta' };

interface Props {
  tarjeta: TarjetaProducto;
  /** Abre «Nuevo producto» con los datos de la recomendación ya cargados. */
  onCargar: (tarjeta: TarjetaProducto) => void;
  onVerInventario: () => void;
}

/** Resultado de consultar un producto: qué es, cómo se vende según el catálogo y cómo conviene cargarlo. */
export default function TarjetaProductoAsistente({ tarjeta, onCargar, onVerInventario }: Props) {
  const { datos, coincidencias } = tarjeta;
  const p = datos.producto;
  const c = datos.como_cargar;
  if (!p || !c) return null;
  const encontrados = datos.presentaciones_encontradas ?? [];

  return (
    <article className="mt-2 overflow-hidden rounded-2xl border border-cyan-200 bg-white text-slate-800 shadow-sm dark:border-cyan-800/50 dark:bg-slate-900 dark:text-slate-100" aria-label={`Recomendación para ${p.nombre}`}>
      <header className="bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-white">
        <h4 className="text-sm font-extrabold leading-tight">{p.nombre}</h4>
        <p className="text-[11px] text-cyan-50">{[p.principio_activo, p.forma, p.contenido].filter(Boolean).join(' · ')}</p>
      </header>

      <div className="space-y-2.5 p-3 text-xs">
        <p className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 font-semibold ${c.verificado ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100'}`}>
          {c.verificado
            ? <><FaCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" /> Presentación confirmada en el catálogo de Punto Farma</>
            : <><FaExclamationTriangle className="mt-0.5 shrink-0" aria-hidden="true" /> No se pudo confirmar en el catálogo: revisalo con el envase</>}
        </p>

        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Cómo conviene cargarlo</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">Unidad: Unidad</span>
            {c.unidades_por_caja && !c.unidades_por_pack && <span className="rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">Pack (caja) de {c.unidades_por_caja}</span>}
            {c.unidades_por_pack && <span className="rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">Pack/blíster de {c.unidades_por_pack}</span>}
            {c.categoria_sugerida && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{c.categoria_sugerida}</span>}
          </div>
          {c.se_vende_por?.length > 0 && (
            <p className="mt-1.5 text-slate-600 dark:text-slate-300">Se puede vender por: <strong>{c.se_vende_por.map((v) => ETIQUETA_VENTA[v] ?? v).join(' · ')}</strong></p>
          )}
        </div>

        {c.explicacion && <p className="leading-snug text-slate-700 dark:text-slate-200">{c.explicacion}</p>}

        {datos.alertas && datos.alertas.length > 0 && (
          <ul className="space-y-1">
            {datos.alertas.map((a) => (
              <li key={a} className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"><FaExclamationTriangle className="mt-0.5 shrink-0" aria-hidden="true" /> {a}</li>
            ))}
          </ul>
        )}

        {encontrados.length > 0 && (
          <details className="rounded-lg border border-slate-200 dark:border-slate-700">
            <summary className="cursor-pointer px-2 py-1.5 font-semibold text-slate-700 dark:text-slate-200">Lo que encontré en Punto Farma ({encontrados.length})</summary>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {encontrados.map((e) => (
                <li key={e.url} className="flex items-start justify-between gap-2 px-2 py-1.5">
                  <span className="min-w-0">
                    <span className="block leading-snug capitalize">{e.descripcion}</span>
                    <span className={`text-[10px] font-bold ${e.mismo_producto ? 'text-emerald-700' : 'text-slate-400'}`}>{e.mismo_producto ? 'Mismo producto' : 'Producto parecido (otra marca)'}</span>
                  </span>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 shrink-0 text-blue-600 hover:text-blue-800" aria-label={`Abrir ${e.descripcion} en Punto Farma`} title="Abrir en Punto Farma"><FaExternalLinkAlt size={11} /></a>
                </li>
              ))}
            </ul>
          </details>
        )}

        {coincidencias.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-900 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100">
            <p className="font-bold">Ojo: ya tenés algo parecido cargado</p>
            <ul className="mt-0.5 space-y-0.5">
              {coincidencias.slice(0, 3).map((x) => (
                <li key={x.idproducto}>{x.nombre_producto} · stock {x.stock}{x.precio_venta ? ` · ${gs(x.precio_venta)}` : ''}</li>
              ))}
            </ul>
            <button type="button" onClick={onVerInventario} className="mt-1 font-bold underline">Ver mis productos</button>
          </div>
        )}

        <button type="button" onClick={() => onCargar(tarjeta)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700">
          <FaPlus aria-hidden="true" /> Cargar así
        </button>
        <p className="text-center text-[10px] text-slate-500">Se abre «Nuevo producto» con estos datos; vos completás precios, lote y stock y revisás antes de guardar.</p>
      </div>
    </article>
  );
}
