import { FaAngleDoubleDown, FaAngleDoubleUp } from 'react-icons/fa';
import type { FormaLogo } from '../../services/publicidad';

type Fondo = 'auto' | 'blanca' | 'oscura' | 'ninguna';
const FORMAS: [FormaLogo, string][] = [['redondeado', 'Redondeado'], ['redondo', 'Círculo'], ['cuadrado', 'Cuadrado'], ['rectangulo', 'Rectángulo']];
const FONDOS: [Fondo, string][] = [['auto', 'Automático'], ['blanca', 'Blanco'], ['oscura', 'Oscuro'], ['ninguna', 'Sin fondo']];
const COLORES = ['#ffffff', '#111827', '#e11d48', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#7c3aed'];

interface Props {
  forma: FormaLogo;
  onForma: (f: FormaLogo) => void;
  fondo: Fondo;
  onFondo: (f: Fondo) => void;
  color: string | null;
  onColor: (c: string | null) => void;
  relleno: boolean;
  onRelleno: (v: boolean) => void;
  atras: boolean;
  onAtras: (v: boolean) => void;
  huecos: boolean;
  onHuecos: (v: boolean) => void;
}

const chip = (activo: boolean) => `rounded-full border px-2.5 py-1 text-xs font-bold ${activo ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200'}`;

/** Opciones del logo (forma, fondo, color, recorte y capa): aparecen al tocar el logo en la vista previa. */
export default function PanelLogo({ forma, onForma, fondo, onFondo, color, onColor, relleno, onRelleno, atras, onAtras, huecos, onHuecos }: Props) {
  const b = 'inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border px-2 text-[11px] font-semibold';
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-violet-200 bg-violet-50/50 p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="Opciones del logo">
      <p className="text-sm font-bold">Logo</p>
      <div>
        <span className="font-semibold">Forma</span>
        <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Forma del logo">
          {FORMAS.map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={forma === v} onClick={() => onForma(v)} className={chip(forma === v)}>{t}</button>)}
        </div>
      </div>
      <label className="flex items-start gap-2 font-semibold">
        <input type="checkbox" checked={relleno} onChange={(e) => onRelleno(e.target.checked)} className="mt-0.5" />
        <span>Recortar el logo con la forma<span className="block font-normal text-slate-500">El logo llena el círculo o el cuadrado. Va bien con logos casi cuadrados; uno muy alargado entra entero.</span></span>
      </label>
      <label className="flex items-start gap-2 font-semibold">
        <input type="checkbox" checked={huecos} onChange={(e) => onHuecos(e.target.checked)} className="mt-0.5" />
        <span>Quitar también el blanco de adentro<span className="block font-normal text-slate-500">Borra el blanco que queda dentro de las letras (la «o», la «a», la «p») y el contorno blanquecino.</span></span>
      </label>
      <div>
        <span className="font-semibold">Fondo</span>
        <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Fondo del logo">
          {FONDOS.map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={!color && fondo === v} onClick={() => { onColor(null); onFondo(v); }} className={chip(!color && fondo === v)}>{t}</button>)}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Color de fondo del logo">
          {COLORES.map((c) => <button key={c} type="button" aria-label={`Fondo ${c}`} onClick={() => onColor(c)} className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-rose-500' : 'border-slate-300'}`} style={{ background: c }} />)}
          <input type="color" value={color || '#ffffff'} onChange={(e) => onColor(e.target.value)} aria-label="Color de fondo personalizado" className="h-6 w-8 cursor-pointer rounded border border-slate-300" />
        </div>
      </div>
      <div>
        <span className="font-semibold">Capa</span>
        <div className="mt-1 flex gap-1.5" role="group" aria-label="Capa del logo">
          <button type="button" aria-pressed={!atras} onClick={() => onAtras(false)} className={`${b} ${!atras ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}><FaAngleDoubleUp size={11} /> Delante de todo</button>
          <button type="button" aria-pressed={atras} onClick={() => onAtras(true)} className={`${b} ${atras ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}><FaAngleDoubleDown size={11} /> Detrás de las piezas</button>
        </div>
      </div>
    </div>
  );
}
