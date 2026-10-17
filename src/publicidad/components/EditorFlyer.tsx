import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { FaAlignCenter, FaArrowsAlt, FaRedo, FaUndo } from 'react-icons/fa';
import type { AjustePieza, CajaPieza, LayoutFlyer } from '../../services/publicidad';

type PiezaFlyer = string;

export const NOMBRE_PIEZA: Record<string, string> = {
  foto: 'Foto',
  titulo: 'Título',
  nombre: 'Nombre',
  precio: 'Precio',
  descuento: 'Descuento',
  contacto: 'Contacto',
  logo: 'Logo',
};

const SIN_AJUSTE: AjustePieza = { dx: 0, dy: 0, s: 1 };
const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
/** Distancia (en píxeles de pantalla) a la que una pieza "se pega" a una guía. */
const IMAN = 7;

type Esquina = 'nw' | 'ne' | 'sw' | 'se';
const ESQUINAS: { id: Esquina; hx: -1 | 1; hy: -1 | 1; css: string; cursor: string }[] = [
  { id: 'nw', hx: -1, hy: -1, css: '-top-2.5 -left-2.5', cursor: 'cursor-nwse-resize' },
  { id: 'ne', hx: 1, hy: -1, css: '-top-2.5 -right-2.5', cursor: 'cursor-nesw-resize' },
  { id: 'sw', hx: -1, hy: 1, css: '-bottom-2.5 -left-2.5', cursor: 'cursor-nesw-resize' },
  { id: 'se', hx: 1, hy: 1, css: '-bottom-2.5 -right-2.5', cursor: 'cursor-nwse-resize' },
];

export interface HistorialLayout {
  deshacer: () => void;
  rehacer: () => void;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
}

interface Props {
  /** Imagen del flyer (data URL). */
  vista: string;
  ancho: number;
  alto: number;
  /** Rectángulo de cada pieza, en píxeles del flyer, con las posiciones actuales ya aplicadas. */
  elementos: Record<string, CajaPieza>;
  /** Nombre a mostrar de cada pieza agregada por el usuario (id "x_…"). */
  nombresExtras?: Record<string, string>;
  /** Mueve o cambia de tamaño un texto o forma agregado (desplazamiento en píxeles del flyer y factor de tamaño). */
  onExtra?: (id: string, dx: number, dy: number, f: number) => void;
  seleccion: string | null;
  onSeleccion: (id: string | null) => void;
  layout: LayoutFlyer;
  onLayout: (l: LayoutFlyer) => void;
  historial: HistorialLayout;
  /** Se está armando una versión nueva (la imagen se ve atenuada). */
  armando: boolean;
  /** Mostrar las manijas para mover y agrandar. */
  editando: boolean;
  /** Cambia cada vez que llega una imagen nueva: se descartan los ajustes provisorios. */
  version: number;
}

interface Arrastre {
  id: PiezaFlyer;
  modo: 'mover' | Esquina;
  x0: number;
  y0: number;
  ajuste0: AjustePieza;
  caja0: CajaPieza;
  k: number; // píxeles del flyer por píxel de pantalla
}

interface Provisorio { dx: number; dy: number; f: number }
interface Guias { x: number[]; y: number[] }

/**
 * Editor del flyer, al estilo de las herramientas de diseño: se arrastra cada pieza (se pega a los bordes, al centro y a
 * las demás piezas, con guías), las cuatro esquinas de la pieza elegida la agrandan o achican, hay deshacer y rehacer, y
 * botones para centrarla. Mientras se arrastra solo se mueve el recuadro; al soltar se pide al servidor el flyer con la
 * nueva posición (el servidor es quien dibuja, así lo que se ve acá es exactamente lo que se descarga).
 */
export default function EditorFlyer({ vista, ancho, alto, elementos, nombresExtras = {}, onExtra, seleccion, onSeleccion: setSeleccion, layout, onLayout, historial, armando, editando, version }: Props) {
  const esExtra = (id: string) => id.startsWith('x_');
  const nombre = (id: string) => NOMBRE_PIEZA[id] || nombresExtras[id] || 'Elemento';
  const contenedor = useRef<HTMLDivElement>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const [mov, setMov] = useState<(Provisorio & { id: PiezaFlyer }) | null>(null);
  const [guias, setGuias] = useState<Guias>({ x: [], y: [] });
  const [optimista, setOptimista] = useState<Partial<Record<PiezaFlyer, Provisorio>>>({});

  useEffect(() => { setOptimista({}); }, [version]);
  useEffect(() => { if (!editando) setSeleccion(null); }, [editando]);
  useEffect(() => { if (seleccion && !seleccion.startsWith('x_') && !elementos[seleccion]) setSeleccion(null); }, [elementos, seleccion]);

  // Las piezas grandes abajo y las chicas arriba, para poder agarrar las chicas aunque estén encima de la foto.
  const piezas = useMemo(
    () => (Object.entries(elementos) as [string, CajaPieza][])
      .filter(([, c]) => c && c.w > 0 && c.h > 0)
      .sort((a, b) => b[1].w * b[1].h - a[1].w * a[1].h),
    [elementos],
  );

  const ajusteDe = (id: PiezaFlyer): AjustePieza => layout[id as keyof LayoutFlyer] || SIN_AJUSTE;

  const confirmar = (id: PiezaFlyer, nuevo: AjustePieza) => {
    const next: LayoutFlyer = { ...layout };
    if (Math.abs(nuevo.dx) < 1 && Math.abs(nuevo.dy) < 1 && Math.abs(nuevo.s - 1) < 0.005) delete next[id as keyof LayoutFlyer];
    else next[id as keyof LayoutFlyer] = { dx: Math.round(nuevo.dx), dy: Math.round(nuevo.dy), s: Math.round(limitar(nuevo.s, 0.2, 4) * 1000) / 1000 };
    onLayout(next);
  };

  /** Rectángulo de una pieza con un movimiento provisorio aplicado (escala alrededor de su centro). */
  const conProvisorio = (c: CajaPieza, p: Provisorio) => {
    const w = c.w * p.f;
    const h = c.h * p.f;
    return { x: c.x + c.w / 2 + p.dx - w / 2, y: c.y + c.h / 2 + p.dy - h / 2, w, h };
  };

  /** Pega la pieza a los bordes y al centro del flyer y a las demás piezas; devuelve el ajuste y las guías a dibujar. */
  const pegar = (id: PiezaFlyer, caja: CajaPieza, p: Provisorio, k: number): { p: Provisorio; guias: Guias } => {
    const umbral = IMAN * k;
    const r = conProvisorio(caja, p);
    const xs = [0, ancho / 2, ancho];
    const ys = [0, alto / 2, alto];
    for (const [otro, c] of piezas) {
      if (otro === id) continue;
      xs.push(c.x, c.x + c.w / 2, c.x + c.w);
      ys.push(c.y, c.y + c.h / 2, c.y + c.h);
    }
    const buscar = (bordes: number[], objetivos: number[]) => {
      let mejor: { d: number; obj: number } | null = null;
      for (const b of bordes) for (const o of objetivos) {
        const d = o - b;
        if (Math.abs(d) <= umbral && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, obj: o };
      }
      return mejor;
    };
    const sx = buscar([r.x, r.x + r.w / 2, r.x + r.w], xs);
    const sy = buscar([r.y, r.y + r.h / 2, r.y + r.h], ys);
    return {
      p: { ...p, dx: p.dx + (sx?.d || 0), dy: p.dy + (sy?.d || 0) },
      guias: { x: sx ? [sx.obj] : [], y: sy ? [sy.obj] : [] },
    };
  };

  const empezar = (e: PointerEvent<HTMLElement>, id: PiezaFlyer, modo: Arrastre['modo']) => {
    const caja = elementos[id];
    const rect = contenedor.current?.getBoundingClientRect();
    if (!caja || !rect || !rect.width) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { id, modo, x0: e.clientX, y0: e.clientY, ajuste0: ajusteDe(id), caja0: caja, k: ancho / rect.width };
    setSeleccion(id);
    contenedor.current?.focus({ preventScroll: true });
  };

  const calcular = (e: PointerEvent<HTMLElement>): { p: Provisorio; guias: Guias } | null => {
    const a = arrastre.current;
    if (!a) return null;
    const ddx = (e.clientX - a.x0) * a.k;
    const ddy = (e.clientY - a.y0) * a.k;
    if (a.modo === 'mover') return pegar(a.id, a.caja0, { dx: ddx, dy: ddy, f: 1 }, a.k);
    // Esquina: la pieza crece (o se achica) y la esquina opuesta queda quieta.
    const m = ESQUINAS.find((x) => x.id === a.modo)!;
    const f = limitar(Math.max((a.caja0.w + m.hx * ddx) / a.caja0.w, (a.caja0.h + m.hy * ddy) / a.caja0.h), 0.2 / a.ajuste0.s, 4 / a.ajuste0.s);
    return { p: { dx: (m.hx * (f - 1) * a.caja0.w) / 2, dy: (m.hy * (f - 1) * a.caja0.h) / 2, f }, guias: { x: [], y: [] } };
  };

  const mover = (e: PointerEvent<HTMLElement>) => {
    const a = arrastre.current;
    const r = calcular(e);
    if (a && r) { setMov({ id: a.id, ...r.p }); setGuias(r.guias); }
  };

  const soltar = (e: PointerEvent<HTMLElement>) => {
    const a = arrastre.current;
    const r = calcular(e);
    arrastre.current = null;
    setMov(null);
    setGuias({ x: [], y: [] });
    if (!a || !r) return;
    const p = r.p;
    if (Math.abs(p.dx) < 1 && Math.abs(p.dy) < 1 && Math.abs(p.f - 1) < 0.005) return; // solo fue un toque: queda seleccionada
    setOptimista((o) => ({ ...o, [a.id]: p }));
    if (esExtra(a.id)) onExtra?.(a.id.slice(2), p.dx, p.dy, p.f);
    else confirmar(a.id, { dx: a.ajuste0.dx + p.dx, dy: a.ajuste0.dy + p.dy, s: a.ajuste0.s * p.f });
  };

  const centrar = (eje: 'h' | 'v') => {
    if (!seleccion) return;
    const c = elementos[seleccion];
    if (!c) return;
    const a = ajusteDe(seleccion);
    const dx = eje === 'h' ? ancho / 2 - (c.x + c.w / 2) : 0;
    const dy = eje === 'v' ? alto / 2 - (c.y + c.h / 2) : 0;
    setOptimista((o) => ({ ...o, [seleccion]: { dx, dy, f: 1 } }));
    if (esExtra(seleccion)) onExtra?.(seleccion.slice(2), dx, dy, 1);
    else confirmar(seleccion, { ...a, dx: a.dx + dx, dy: a.dy + dy });
  };

  const teclas = (e: KeyboardEvent<HTMLElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) historial.rehacer(); else historial.deshacer(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); historial.rehacer(); return; }
    if (!seleccion) return;
    const paso = e.shiftKey ? 25 : 5;
    const a = ajusteDe(seleccion);
    const mapa: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
    const d = mapa[e.key];
    if (d) { e.preventDefault(); setOptimista((o) => ({ ...o, [seleccion]: { dx: d[0], dy: d[1], f: 1 } })); if (esExtra(seleccion)) onExtra?.(seleccion.slice(2), d[0], d[1], 1); else confirmar(seleccion, { ...a, dx: a.dx + d[0], dy: a.dy + d[1] }); }
    else if (e.key === 'Escape') setSeleccion(null);
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); if (esExtra(seleccion)) onExtra?.(seleccion.slice(2), 0, 0, 1.1); else confirmar(seleccion, { ...a, s: a.s * 1.1 }); }
    else if (e.key === '-') { e.preventDefault(); if (esExtra(seleccion)) onExtra?.(seleccion.slice(2), 0, 0, 1 / 1.1); else confirmar(seleccion, { ...a, s: a.s / 1.1 }); }
  };

  const cajaVista = (id: PiezaFlyer, c: CajaPieza) => {
    const p = mov?.id === id ? mov : optimista[id];
    return p ? conProvisorio(c, p) : c;
  };

  const ajusteSel = seleccion ? ajusteDe(seleccion) : null;
  const boton = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200';

  return (
    <div>
      {editando && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800" role="toolbar" aria-label="Herramientas del editor">
          <button type="button" className={boton} onClick={historial.deshacer} disabled={!historial.puedeDeshacer} aria-label="Deshacer" title="Deshacer (Ctrl+Z)"><FaUndo size={12} /></button>
          <button type="button" className={boton} onClick={historial.rehacer} disabled={!historial.puedeRehacer} aria-label="Rehacer" title="Rehacer (Ctrl+Y)"><FaRedo size={12} /></button>
          <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />
          <button type="button" className={boton} onClick={() => centrar('h')} disabled={!seleccion} aria-label="Centrar horizontalmente" title="Centrar horizontalmente"><FaAlignCenter size={12} /></button>
          <button type="button" className={boton} onClick={() => centrar('v')} disabled={!seleccion} aria-label="Centrar verticalmente" title="Centrar verticalmente"><FaAlignCenter size={12} style={{ transform: 'rotate(90deg)' }} /></button>
          <span className="ml-auto pr-1 text-[11px] font-semibold text-slate-500">{seleccion ? nombre(seleccion) : 'Elegí una pieza'}</span>
        </div>
      )}

      <div
        ref={contenedor}
        className={`relative select-none overflow-hidden rounded-xl bg-slate-100 outline-none dark:bg-slate-800 ${editando ? 'ring-2 ring-rose-300' : ''}`}
        style={{ aspectRatio: `${ancho} / ${alto}`, touchAction: editando ? 'none' : 'auto' }}
        tabIndex={editando ? 0 : -1}
        onKeyDown={teclas}
        onPointerDown={() => { if (editando) setSeleccion(null); }}
      >
        <img src={vista} alt="Flyer" draggable={false} className={`absolute inset-0 h-full w-full transition-opacity ${armando ? 'opacity-60' : ''}`} />

        {editando && guias.x.map((x) => <div key={`gx${x}`} className="pointer-events-none absolute top-0 z-30 h-full w-px bg-fuchsia-500" style={{ left: `${(x / ancho) * 100}%` }} />)}
        {editando && guias.y.map((y) => <div key={`gy${y}`} className="pointer-events-none absolute left-0 z-30 h-px w-full bg-fuchsia-500" style={{ top: `${(y / alto) * 100}%` }} />)}

        {editando && piezas.map(([id, c0]) => {
          const c = cajaVista(id, c0);
          const activa = seleccion === id;
          const movida = !!layout[id as keyof LayoutFlyer] || esExtra(id);
          return (
            <div
              key={id}
              role="button"
              aria-label={`${nombre(id)}: arrastrá para moverla`}
              onPointerDown={(e) => empezar(e, id, 'mover')}
              onPointerMove={mover}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              className={`absolute cursor-move ${activa ? 'z-20 border-2 border-solid border-violet-600 bg-violet-500/10 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]' : 'z-10 border border-dashed border-violet-500/70 hover:border-solid hover:bg-violet-500/10'}`}
              style={{ left: `${(c.x / ancho) * 100}%`, top: `${(c.y / alto) * 100}%`, width: `${(c.w / ancho) * 100}%`, height: `${(c.h / alto) * 100}%`, touchAction: 'none' }}
            >
              <span className={`pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${activa ? 'bg-violet-600' : movida ? 'bg-indigo-500' : 'bg-slate-700/80'}`}>{nombre(id)}</span>
              {activa && ESQUINAS.map((m) => (
                <span
                  key={m.id}
                  role="button"
                  aria-label={`${nombre(id)}: arrastrá la esquina para cambiar el tamaño`}
                  onPointerDown={(e) => empezar(e, id, m.id)}
                  onPointerMove={mover}
                  onPointerUp={soltar}
                  onPointerCancel={soltar}
                  className={`absolute ${m.css} h-5 w-5 ${m.cursor} rounded-full border-2 border-violet-600 bg-white shadow`}
                  style={{ touchAction: 'none' }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {editando && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-live="polite">
          {seleccion && esExtra(seleccion) ? (
            <p className="flex items-center gap-1.5"><FaArrowsAlt /> Arrastrá para mover, tirá de las esquinas para el tamaño. Las opciones de este elemento están abajo de la vista previa.</p>
          ) : seleccion && ajusteSel ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex flex-1 items-center gap-2">
                Tamaño
                <input
                  type="range"
                  min={20}
                  max={300}
                  value={Math.round(ajusteSel.s * 100)}
                  onChange={(e) => confirmar(seleccion, { ...ajusteSel, s: Number(e.target.value) / 100 })}
                  className="min-w-[90px] flex-1"
                  aria-label={`Tamaño de ${nombre(seleccion)}`}
                />
                <span className="w-10 text-right font-semibold">{Math.round(ajusteSel.s * 100)}%</span>
              </label>
              <button type="button" onClick={() => confirmar(seleccion, SIN_AJUSTE)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 font-semibold hover:bg-white dark:border-slate-600"><FaUndo size={10} /> Volver a su lugar</button>
            </div>
          ) : (
            <p className="flex items-center gap-1.5"><FaArrowsAlt /> Tocá una pieza y arrastrala; se pega al centro, a los bordes y a las otras piezas. Las esquinas cambian el tamaño. Flechas para ajustar, + y − para el tamaño, Ctrl+Z para deshacer.</p>
          )}
        </div>
      )}
    </div>
  );
}
