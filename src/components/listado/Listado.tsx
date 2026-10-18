import { Fragment, useState, type ReactNode } from 'react';
import { FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

/**
 * Bloques comunes de las pantallas de listado de Mi Despensa (clientes, productos, proveedores, caja…).
 * Diseño propio: rótulo de estante arriba, buscador en píldora y cada registro como una tarjeta (no como fila de tabla).
 */

export function PaginaListado({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-6 dark:bg-stone-900 sm:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="mx-auto w-full max-w-[1400px]">{children}</div>
    </div>
  );
}

/** Rótulo de estante: icono en una "etiqueta", título grande y una línea de toldo debajo. */
export function EncabezadoListado({ icono, titulo, subtitulo, acciones }: { icono: ReactNode; titulo: string; subtitulo?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-2xl bg-orange-600 text-2xl text-white shadow-md" aria-hidden="true">{icono}</span>
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-stone-900 dark:text-stone-50">{titulo}</h1>
            {subtitulo && <p className="text-sm text-stone-500 dark:text-stone-400">{subtitulo}</p>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      <div aria-hidden="true" className="mt-4 h-2 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#ea580c 0 22px,#ffedd5 22px 44px)' }} />
    </div>
  );
}

const BOTON_BASE = 'flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-base font-extrabold shadow-[0_3px_0_rgba(0,0,0,0.18)] active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2';

export function BotonPrincipal({ onClick, children, color = 'verde' }: { onClick: () => void; children: ReactNode; color?: 'verde' | 'azul' }) {
  const c = color === 'verde' ? 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:outline-orange-700' : 'bg-stone-800 text-white hover:bg-stone-900 focus-visible:outline-stone-900';
  return (
    <button type="button" onClick={onClick} className={`${BOTON_BASE} ${c}`}>
      <span aria-hidden="true" className="text-xl leading-none">+</span>
      {children}
    </button>
  );
}

export function BotonSecundario({ onClick, children, titulo }: { onClick: () => void; children: ReactNode; titulo?: string }) {
  return (
    <button type="button" onClick={onClick} title={titulo} className="whitespace-nowrap rounded-full border-2 border-stone-200 bg-white px-5 py-2 text-sm font-bold text-stone-700 hover:border-orange-300 hover:bg-orange-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700">
      {children}
    </button>
  );
}

export function BarraFiltros({ children, derecha }: { children: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-orange-100 dark:bg-stone-800 dark:ring-stone-700">
      {children}
      {derecha && <div className="ml-auto flex flex-wrap items-center gap-2">{derecha}</div>}
    </div>
  );
}

export function CampoBusqueda({ valor, onCambio, placeholder }: { valor: string; onCambio: (v: string) => void; placeholder: string }) {
  return (
    <label className="min-w-[240px] flex-1 text-xs font-extrabold uppercase tracking-wide text-stone-500">Buscar
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-full px-5 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-900 dark:text-stone-100"
      />
    </label>
  );
}

export interface Columna<T> {
  clave: string;
  titulo: string;
  alinear?: 'left' | 'right' | 'center';
  /** No se parte en varias líneas (fechas, importes). */
  sinSalto?: boolean;
  render: (fila: T) => ReactNode;
}

interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (f: T) => string | number;
  cargando?: boolean;
  /** Texto cuando no hay filas. */
  vacio: string;
  /** Acciones al final de cada registro (Editar, Ver, Borrar…). */
  acciones?: (f: T) => ReactNode;
  anchoMinimo?: number;
  /** Si viene, al hacer doble clic en un registro se despliega este contenido debajo (otro doble clic lo cierra). */
  detalleFila?: (f: T) => ReactNode;
}

/** Cada registro es una tarjeta. En pantallas grandes las columnas se alinean con los rótulos de arriba; en el celular cada dato lleva su rótulo. */
export function TablaListado<T>({ columnas, filas, claveFila, cargando, vacio, acciones, detalleFila }: TablaProps<T>) {
  const [abierta, setAbierta] = useState<string | number | null>(null);
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Cargando">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
      </div>
    );
  }
  if (filas.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-orange-200 bg-white py-14 text-center dark:border-stone-600 dark:bg-stone-800">
        <FaInfoCircle className="mx-auto mb-3 text-4xl text-orange-300" aria-hidden="true" />
        <p className="text-lg font-semibold text-stone-500">{vacio}</p>
      </div>
    );
  }
  const alinea = (a?: string) => (a === 'right' ? 'md:text-right' : a === 'center' ? 'md:text-center' : 'md:text-left');
  const hayAcciones = !!(acciones || detalleFila);
  const plantilla = `minmax(0, 2.2fr) repeat(${Math.max(columnas.length - 1, 0)}, minmax(0, 1fr))${hayAcciones ? ' auto' : ''}`;
  return (
    <div className="relative" role="table">
      {/* Rótulos (solo escritorio) */}
      <div role="row" className="hidden gap-4 pl-8 pr-6 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-stone-400 md:grid" style={{ gridTemplateColumns: plantilla }}>
        {columnas.map((c) => (
          <div key={c.clave} role="columnheader" className={alinea(c.alinear)}>{c.titulo}</div>
        ))}
        {hayAcciones && <div role="columnheader"><span className="sr-only">Acciones</span></div>}
      </div>

      <div className="space-y-3">
        {filas.map((f) => {
          const k = claveFila(f);
          const esta = abierta === k;
          return (
            <Fragment key={k}>
              <div
                role="row"
                className={`group grid gap-x-4 gap-y-2 rounded-3xl border-l-8 bg-white px-6 py-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-stone-800 ${esta ? 'border-orange-600 ring-orange-200' : 'border-orange-200 ring-stone-100 hover:border-orange-500 dark:border-stone-600 dark:ring-stone-700'} ${detalleFila ? 'cursor-pointer select-none' : ''} grid-cols-1 md:items-center md:[grid-template-columns:var(--plantilla)]`}
                style={{ ['--plantilla' as string]: plantilla }}
                {...(detalleFila ? {
                  onDoubleClick: () => { window.getSelection()?.removeAllRanges(); setAbierta((a) => (a === k ? null : k)); },
                  title: 'Doble clic para ver el detalle',
                  'aria-expanded': esta,
                } : {})}
              >
                {columnas.map((c) => (
                  <div key={c.clave} role="cell" className={`${alinea(c.alinear)} ${c.sinSalto ? 'whitespace-nowrap' : ''} min-w-0`}>
                    <span className="mb-0.5 block text-[10px] font-black uppercase tracking-wider text-stone-400 md:hidden">{c.titulo}</span>
                    {c.render(f)}
                  </div>
                ))}
                {hayAcciones && (
                  <div role="cell" className="flex flex-wrap justify-end gap-2">
                    {detalleFila && (
                      <button
                        type="button"
                        onClick={() => setAbierta((x) => (x === k ? null : k))}
                        aria-expanded={esta}
                        className={`${BASE_ACCION} border-2 border-stone-200 text-stone-700 hover:bg-orange-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700`}
                      >
                        <span aria-hidden="true">{esta ? <FaChevronUp /> : <FaChevronDown />}</span>
                        {esta ? 'Ocultar' : 'Ver detalles'}
                      </button>
                    )}
                    {acciones?.(f)}
                  </div>
                )}
              </div>
              {detalleFila && esta && (
                <div className="rounded-3xl bg-orange-50/70 ring-1 ring-orange-100 dark:bg-stone-900/40 dark:ring-stone-700">{detalleFila(f)}</div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

const BASE_ACCION = 'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold';

export function AccionFila({ onClick, icono, texto, tipo = 'primaria', titulo }: { onClick: () => void; icono: ReactNode; texto: string; tipo?: 'primaria' | 'peligro' | 'neutra'; titulo?: string }) {
  const c = tipo === 'primaria'
    ? 'bg-orange-600 text-white hover:bg-orange-700'
    : tipo === 'peligro'
      ? 'border-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
      : 'border-2 border-stone-200 text-stone-700 hover:bg-orange-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700';
  return (
    <button type="button" onClick={onClick} title={titulo ?? texto} className={`${BASE_ACCION} ${c}`}>
      <span aria-hidden="true">{icono}</span>{texto}
    </button>
  );
}

export function Insignia({ color, children }: { color: 'verde' | 'rojo' | 'ambar' | 'azul' | 'gris'; children: ReactNode }) {
  const c = { verde: 'bg-emerald-100 text-emerald-800', rojo: 'bg-rose-100 text-rose-700', ambar: 'bg-amber-100 text-amber-800', azul: 'bg-orange-100 text-orange-800', gris: 'bg-stone-100 text-stone-700' }[color];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold ${c}`}>{children}</span>;
}
