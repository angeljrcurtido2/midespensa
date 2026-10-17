import { useMemo, useState } from 'react';
import { FaPrint, FaTimes } from 'react-icons/fa';
import { modulosCodigoBarras, svgCodigoBarras } from '../utils/codigoBarras';

interface Props {
  producto: { nombre_producto?: string; cod_barra?: string; precio_venta?: number | string };
  onClose: () => void;
}

const TAMANOS = {
  chica: { etiqueta: 'Chica (40 × 25 mm)', w: 40, h: 25, nombre: 7, precio: 9, digitos: 6 },
  media: { etiqueta: 'Media (50 × 30 mm)', w: 50, h: 30, nombre: 8, precio: 11, digitos: 7 },
  grande: { etiqueta: 'Grande (70 × 40 mm)', w: 70, h: 40, nombre: 10, precio: 14, digitos: 8 },
} as const;
type Tam = keyof typeof TAMANOS;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const gs = (n: unknown) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;

/** Arma la etiqueta (nombre, precio, barras y número) como HTML, para imprimir y para la vista previa. */
const htmlEtiqueta = (p: Props['producto'], t: (typeof TAMANOS)[Tam], conPrecio: boolean) => `
  <div class="et" style="width:${t.w}mm;height:${t.h}mm">
    <div class="nom" style="font-size:${t.nombre}pt">${esc(String(p.nombre_producto || '').slice(0, 42))}</div>
    ${conPrecio ? `<div class="pre" style="font-size:${t.precio}pt">${gs(p.precio_venta)}</div>` : ''}
    <div class="bar">${svgCodigoBarras(String(p.cod_barra))}</div>
    <div class="num" style="font-size:${t.digitos}pt">${esc(String(p.cod_barra))}</div>
  </div>`;

// Estilos de la etiqueta: todo cuelga de ".et" para que la vista previa no afecte al resto de la pantalla.
const CSS_ETIQUETA = `
  .et,.et *{box-sizing:border-box;margin:0;padding:0}
  .et{font-family:Arial,Helvetica,sans-serif;color:#000;padding:1.2mm 1.5mm;display:flex;flex-direction:column;justify-content:space-between;align-items:center;overflow:hidden;border:0.1mm dashed #bbb;page-break-inside:avoid;background:#fff}
  .et .nom{font-weight:700;text-align:center;line-height:1.1;max-height:2.3em;overflow:hidden;width:100%}
  .et .pre{font-weight:800}
  .et .bar{width:100%;flex:1;min-height:0;display:flex}
  .et .bar svg{width:100%;height:100%}
  .et .num{letter-spacing:.5px;font-family:'Courier New',monospace}
  @media print{.et{border-color:transparent}}`;
const CSS_HOJA = `body{margin:0}.hoja{display:flex;flex-wrap:wrap}@page{margin:5mm}`;

const ESCALA: Record<Tam, number> = { chica: 2.6, media: 2.2, grande: 1.6 };

export default function ModalEtiquetas({ producto, onClose }: Props) {
  const [tam, setTam] = useState<Tam>('media');
  const [copias, setCopias] = useState(1);
  const [conPrecio, setConPrecio] = useState(true);
  const codigo = String(producto.cod_barra ?? '').trim();
  const dibujable = useMemo(() => !!modulosCodigoBarras(codigo), [codigo]);
  const t = TAMANOS[tam];
  const unaEtiqueta = useMemo(() => htmlEtiqueta(producto, t, conPrecio), [producto, t, conPrecio]);

  const imprimir = () => {
    const n = Math.max(1, Math.min(500, Math.floor(copias) || 1));
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas</title><style>${CSS_ETIQUETA}${CSS_HOJA}</style></head><body><div class="hoja">${unaEtiqueta.repeat(n)}</div></body></html>`);
    doc.close();
    const lanzar = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 60000);
    };
    setTimeout(lanzar, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Imprimir etiquetas">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Imprimir etiquetas</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><FaTimes /></button>
        </div>

        {!dibujable ? (
          <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">Este producto no tiene un código de barras que se pueda imprimir. Cargá o generá uno primero.</p>
        ) : (
          <>
            <div className="mb-4 flex justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 py-6 dark:border-slate-600 dark:bg-slate-900" aria-label="Vista previa de la etiqueta">
              <style>{CSS_ETIQUETA}</style>
              {/* zoom hace que la vista previa ocupe lugar real (a diferencia de transform) */}
              <div dangerouslySetInnerHTML={{ __html: unaEtiqueta }} style={{ zoom: ESCALA[tam], boxShadow: '0 1px 6px rgba(0,0,0,.25)' } as React.CSSProperties} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-200">
                Tamaño
                <select value={tam} onChange={(e) => setTam(e.target.value as Tam)} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700">
                  {(Object.keys(TAMANOS) as Tam[]).map((k) => <option key={k} value={k}>{TAMANOS[k].etiqueta}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-200">
                Cantidad de etiquetas
                <input type="number" min={1} max={500} value={copias} onChange={(e) => setCopias(Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700" />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={conPrecio} onChange={(e) => setConPrecio(e.target.checked)} /> Mostrar el precio de venta
            </label>
            <p className="mt-3 text-xs text-slate-500">En el cuadro de impresión elegí tu impresora de etiquetas, o una común para imprimirlas en hoja y recortarlas.</p>
          </>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">Cerrar</button>
          {dibujable && <button type="button" onClick={imprimir} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"><FaPrint aria-hidden="true" /> Imprimir</button>}
        </div>
      </div>
    </div>
  );
}
