import { FaBox, FaBoxOpen, FaCheck, FaEdit } from 'react-icons/fa';
import ImagenAmpliable from '../../components/ImagenAmpliable';
import { urlImagenProducto } from '../../services/productos';
import { promoVigenteHoy } from '../../utils/promo';
import { ETIQUETA_RECETA } from '../../components/DatosFarmaciaProducto';

interface Props {
  producto: any;
  /** Nombre de la categoría (el listado solo trae su id). */
  categoria?: string;
  /** Si viene, se muestra el botón para elegir el producto (pantalla de selección). */
  onSeleccionar?: () => void;
  /** Si viene, se muestra el botón para editarlo (listado normal). */
  onEditar?: () => void;
}

const gs = (n: unknown) => (Number(n) > 0 ? `Gs. ${Number(n).toLocaleString('es-PY')}` : null);
const fecha = (f?: string | null) => (f ? new Date(f).toLocaleDateString('es-PY', { timeZone: 'UTC' }) : null);

function Dato({ titulo, valor, destacado = false }: { titulo: string; valor: React.ReactNode; destacado?: boolean }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{titulo}</dt>
      <dd className={`mt-0.5 ${destacado ? 'text-xl font-extrabold text-slate-900 dark:text-slate-50' : 'text-base font-semibold text-slate-800 dark:text-slate-100'}`}>{valor}</dd>
    </div>
  );
}

/** Detalle del producto que se despliega debajo de su fila (doble clic): foto grande y todos sus datos, sin abrir ventanas. */
export default function DetalleProductoFila({ producto: p, categoria, onSeleccionar, onEditar }: Props) {
  const stock = Number(p.stock);
  const enPromo = p.en_promo || promoVigenteHoy(p);
  const oferta = Number(p.oferta_cantidad) >= 2 && Number(p.oferta_precio) > 0 ? `${p.oferta_cantidad} por ${gs(p.oferta_precio)}` : null;
  const pack = Number(p.cant_p_pack) > 0 ? `${p.cant_p_pack} unidades · ${gs(p.precio_venta_pack) ?? 'sin precio'}` : null;
  const caja = String(p.unidad_medida).toUpperCase() === 'CAJA' && Number(p.cant_p_caja) > 0 ? `${p.cant_p_caja} unidades · ${gs(p.precio_venta_caja) ?? 'sin precio'}` : null;

  return (
    <div className="grid gap-5 bg-blue-50/60 p-5 dark:bg-slate-900/40 md:grid-cols-[304px_minmax(0,1fr)]" aria-label={`Detalle de ${p.nombre_producto}`}>
      <div className="flex flex-col items-center gap-2">
        {p.imagen ? (
          <ImagenAmpliable src={urlImagenProducto(p.imagen)} alt={p.nombre_producto} leyenda={p.nombre_producto} tamano="h-72 w-72 max-w-full" />
        ) : (
          <div className="flex h-72 w-72 max-w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800">
            <span className="text-6xl" aria-hidden="true">{String(p.unidad_medida).toUpperCase() === 'CAJA' ? <FaBox /> : <FaBoxOpen />}</span>
            <span className="text-sm font-semibold">Este producto no tiene foto</span>
          </div>
        )}
        {p.imagen && <p className="text-xs text-slate-500">Tocá la foto para verla más grande</p>}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">{p.nombre_producto}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{[categoria, p.unidad_medida, p.ubicacion].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex gap-2">
            {onSeleccionar && (
              <button type="button" onClick={onSeleccionar} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                <FaCheck aria-hidden="true" /> Seleccionar
              </button>
            )}
            {onEditar && (
              <button type="button" onClick={onEditar} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <FaEdit aria-hidden="true" /> Editar
              </button>
            )}
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Dato titulo="Precio de venta" valor={gs(p.precio_venta) ?? 'Sin precio'} destacado />
          <Dato titulo="Stock" valor={<span className={stock <= 0 ? 'text-red-600' : stock <= 10 ? 'text-amber-600' : 'text-emerald-700'}>{p.stock} {String(p.unidad_medida || '').toLowerCase()}</span>} destacado />
          <Dato titulo="Código de barras" valor={p.cod_barra ? <span className="font-mono text-sm">{p.cod_barra}</span> : 'Sin código'} />
          <Dato titulo="Último costo" valor={gs(p.lote_pr_compr_rec) ?? gs(p.precio_compra)} />
          <Dato titulo="IVA" valor={`${Number(p.iva)} %`} />
          <Dato titulo="Principio activo" valor={p.principio_activo} />
          <Dato titulo="Laboratorio" valor={p.laboratorio} />
          <Dato titulo="Condición de venta" valor={p.receta && p.receta !== 'libre' ? ETIQUETA_RECETA[p.receta] ?? p.receta : null} />
          <Dato titulo="Stock mínimo" valor={p.stock_minimo !== null && p.stock_minimo !== undefined && p.stock_minimo !== '' ? `${Number(p.stock_minimo)} ${String(p.unidad_medida || '').toLowerCase()}` : null} />
          <Dato titulo="Pack" valor={pack} />
          <Dato titulo="Caja" valor={caja} />
          <Dato titulo="Oferta por cantidad" valor={oferta} />
          <Dato titulo="Promoción vigente" valor={enPromo ? [gs(p.precio_promo) && `Unidad ${gs(p.precio_promo)}`, gs(p.precio_promo_pack) && `Pack ${gs(p.precio_promo_pack)}`, gs(p.precio_promo_caja) && `Caja ${gs(p.precio_promo_caja)}`].filter(Boolean).join(' · ') || (p.promo_titulo ?? 'Sí') : null} />
          <Dato titulo="Último lote" valor={p.lotenumreciente} />
          <Dato titulo="Vence" valor={fecha(p.ultima_fecha_vencimiento)} />
        </dl>
      </div>
    </div>
  );
}
