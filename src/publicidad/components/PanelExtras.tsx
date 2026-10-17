import { FaAngleDoubleDown, FaAngleDoubleUp, FaArrowDown, FaArrowUp, FaBold, FaClone, FaFont, FaShapes, FaTrash } from 'react-icons/fa';
import type { ExtraFlyer, ExtraForma, ExtraTexto, FormaExtra, FuenteExtra } from '../../services/publicidad';

const FORMAS: [FormaExtra, string][] = [['rect', 'Rectángulo'], ['redondeado', 'Redondeado'], ['circulo', 'Círculo'], ['triangulo', 'Triángulo'], ['estrella', 'Estrella'], ['linea', 'Línea']];
const FUENTES: [FuenteExtra, string][] = [['sans', 'Moderna'], ['serif', 'Clásica'], ['impacto', 'Impacto'], ['cursiva', 'Cursiva']];
const COLORES = ['#ffffff', '#111827', '#e11d48', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#7c3aed'];

const nuevoId = () => Math.random().toString(36).slice(2, 8);

export const nuevoExtra = (tipo: 'texto' | 'forma'): ExtraFlyer => tipo === 'texto'
  ? { id: nuevoId(), tipo, texto: 'Tu texto acá', x: 0.5, y: 0.5, tam: 0.06, color: '#ffffff', fondo: '#e11d48', negrita: true, fuente: 'sans' }
  : { id: nuevoId(), tipo, forma: 'circulo', x: 0.5, y: 0.5, w: 0.2, h: 0.2, color: '#facc15', opacidad: 1 };

export const nombreExtra = (e: ExtraFlyer) => (e.tipo === 'texto' ? `Texto: ${e.texto.split('\n')[0].slice(0, 14)}` : `Forma: ${FORMAS.find((f) => f[0] === e.forma)?.[1] || ''}`);

export type AccionCapa = 'frente' | 'subir' | 'bajar' | 'fondo';

/**
 * Orden de las capas de los textos y formas agregados: los «atrás» van debajo de las piezas del diseño (foto, textos…) y el resto
 * encima de todo. Se mantiene la lista con los «atrás» primero; subir/bajar cruza de un grupo al otro en el borde.
 */
export const moverCapa = (extras: ExtraFlyer[], id: string, accion: AccionCapa): ExtraFlyer[] => {
  const lista = [...extras.filter((e) => e.atras), ...extras.filter((e) => !e.atras)];
  const k = lista.filter((e) => e.atras).length;
  const i = lista.findIndex((e) => e.id === id);
  if (i < 0) return extras;
  const intercambiar = (a: number, b: number) => { [lista[a], lista[b]] = [lista[b], lista[a]]; };
  const e = lista[i];
  if (accion === 'frente') { lista.splice(i, 1); lista.push({ ...e, atras: false }); }
  else if (accion === 'fondo') { lista.splice(i, 1); lista.unshift({ ...e, atras: true }); }
  else if (accion === 'subir') {
    if (e.atras && i === k - 1) lista[i] = { ...e, atras: false };
    else if (i < lista.length - 1) intercambiar(i, i + 1);
  } else if (!e.atras && i === k) lista[i] = { ...e, atras: true };
  else if (i > 0) intercambiar(i, i - 1);
  return lista;
};

export function BotonesCapa({ onCapa, extraDesc }: { onCapa: (a: AccionCapa) => void; extraDesc?: string }) {
  const b = 'inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200';
  return (
    <div>
      <span className="font-semibold">Capas</span>
      <div className="mt-1 flex gap-1.5" role="group" aria-label="Capas">
        <button type="button" className={b} onClick={() => onCapa('frente')} title="Traer al frente"><FaAngleDoubleUp size={11} /> Al frente</button>
        <button type="button" className={b} onClick={() => onCapa('subir')} title="Subir una capa"><FaArrowUp size={10} /> Subir</button>
        <button type="button" className={b} onClick={() => onCapa('bajar')} title="Bajar una capa"><FaArrowDown size={10} /> Bajar</button>
        <button type="button" className={b} onClick={() => onCapa('fondo')} title="Llevar al fondo"><FaAngleDoubleDown size={11} /> Al fondo</button>
      </div>
      {extraDesc && <p className="mt-1 text-[11px] text-slate-500">{extraDesc}</p>}
    </div>
  );
}

interface Props {
  extras: ExtraFlyer[];
  seleccion: string | null;
  onExtras: (e: ExtraFlyer[]) => void;
  onSeleccion: (id: string | null) => void;
  onAgregar: (tipo: 'texto' | 'forma') => void;
}

const chip = (activo: boolean) => `rounded-full border px-2.5 py-1 text-xs font-bold ${activo ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200'}`;
const btn = 'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold';

function Colores({ valor, onCambio, etiqueta }: { valor: string; onCambio: (c: string) => void; etiqueta: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={etiqueta}>
      {COLORES.map((c) => (
        <button key={c} type="button" aria-label={`${etiqueta} ${c}`} onClick={() => onCambio(c)} className={`h-6 w-6 rounded-full border-2 ${valor === c ? 'border-rose-500' : 'border-slate-300'}`} style={{ background: c }} />
      ))}
      <input type="color" value={valor} onChange={(e) => onCambio(e.target.value)} aria-label={`${etiqueta} personalizado`} className="h-6 w-8 cursor-pointer rounded border border-slate-300" />
    </div>
  );
}

/** Botones para agregar textos y formas, y opciones del elemento elegido (texto, color, tamaño, fuente, copiar, borrar). */
export default function PanelExtras({ extras, seleccion, onExtras, onSeleccion, onAgregar }: Props) {
  const id = seleccion?.startsWith('x_') ? seleccion.slice(2) : null;
  const e = id ? extras.find((x) => x.id === id) : undefined;
  const cambiar = (parche: Partial<ExtraTexto> | Partial<ExtraForma>) => onExtras(extras.map((x) => (x.id === id ? ({ ...x, ...parche } as ExtraFlyer) : x)));
  const borrar = () => { onExtras(extras.filter((x) => x.id !== id)); onSeleccion(null); };
  const copiar = () => {
    if (!e) return;
    const c = { ...e, id: nuevoId(), x: Math.min(1, e.x + 0.04), y: Math.min(1, e.y + 0.04) } as ExtraFlyer;
    onExtras([...extras, c]); onSeleccion(`x_${c.id}`);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => onAgregar('texto')} className={`${btn} flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}><FaFont /> Agregar texto</button>
        <button type="button" onClick={() => onAgregar('forma')} className={`${btn} flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}><FaShapes /> Agregar forma</button>
      </div>

      {e && (
        <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/50 p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="Opciones del elemento">
          {e.tipo === 'texto' ? (
            <>
              <label className="block font-semibold">Texto
                <textarea value={e.texto} maxLength={120} rows={2} onChange={(ev) => cambiar({ texto: ev.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Letra">
                {FUENTES.map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={e.fuente === v} onClick={() => cambiar({ fuente: v })} className={chip(e.fuente === v)}>{t}</button>)}
                <button type="button" aria-pressed={e.negrita} aria-label="Negrita" onClick={() => cambiar({ negrita: !e.negrita })} className={chip(e.negrita)}><FaBold size={10} /></button>
              </div>
              <div><span className="font-semibold">Color de la letra</span><div className="mt-1"><Colores valor={e.color} onCambio={(c) => cambiar({ color: c })} etiqueta="Color de la letra" /></div></div>
              <div>
                <span className="font-semibold">Fondo del texto</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => cambiar({ fondo: null })} className={chip(!e.fondo)}>Sin fondo</button>
                  <Colores valor={e.fondo || '#e11d48'} onCambio={(c) => cambiar({ fondo: c })} etiqueta="Fondo del texto" />
                </div>
              </div>
              <label className="flex items-center gap-2 font-semibold">Tamaño
                <input type="range" min={15} max={200} value={Math.round(e.tam * 1000)} onChange={(ev) => cambiar({ tam: Number(ev.target.value) / 1000 })} className="flex-1" aria-label="Tamaño del texto" />
              </label>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Forma">
                {FORMAS.map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={e.forma === v} onClick={() => cambiar({ forma: v, ...(v === 'linea' ? { h: 0.006 } : e.forma === 'linea' ? { h: e.w } : {}) })} className={chip(e.forma === v)}>{t}</button>)}
              </div>
              <div><span className="font-semibold">Color</span><div className="mt-1"><Colores valor={e.color} onCambio={(c) => cambiar({ color: c })} etiqueta="Color de la forma" /></div></div>
              <label className="flex items-center gap-2 font-semibold">Transparencia
                <input type="range" min={10} max={100} value={Math.round(e.opacidad * 100)} onChange={(ev) => cambiar({ opacidad: Number(ev.target.value) / 100 })} className="flex-1" aria-label="Opacidad de la forma" />
              </label>
            </>
          )}
          <BotonesCapa onCapa={(a) => onExtras(moverCapa(extras, e.id, a))} extraDesc={e.atras ? 'Está detrás de la foto y los textos del diseño.' : 'Está por encima de todo.'} />
          <div className="flex gap-2">
            <button type="button" onClick={copiar} className={`${btn} border-slate-300 bg-white py-1.5 text-xs hover:bg-slate-50 dark:bg-slate-900`}><FaClone size={11} /> Duplicar</button>
            <button type="button" onClick={borrar} className={`${btn} border-red-200 bg-white py-1.5 text-xs text-red-600 hover:bg-red-50 dark:bg-slate-900`}><FaTrash size={11} /> Eliminar</button>
          </div>
        </div>
      )}
    </div>
  );
}
