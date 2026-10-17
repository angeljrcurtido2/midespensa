import { Fragment, useState, type ReactNode } from 'react';
import { FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

/**
 * Bloques comunes de las pantallas de listado (ventas, compras, clientes, productos…): encabezado corto con la acción
 * principal, barra de filtros en una fila y tabla a todo el ancho. Mantienen el mismo aspecto en todo el sistema.
 */

export function PaginaListado({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 dark:bg-gray-900 sm:px-6" style={{ scrollbarGutter: 'stable' }}>
      <div className="mx-auto w-full max-w-[1800px]">{children}</div>
    </div>
  );
}

export function EncabezadoListado({ icono, titulo, subtitulo, acciones }: { icono: ReactNode; titulo: string; subtitulo?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white" aria-hidden="true">{icono}</span>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">{titulo}</h1>
          {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

const BOTON_BASE = 'flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-base font-bold shadow focus-visible:outline-2 focus-visible:outline-offset-2';

export function BotonPrincipal({ onClick, children, color = 'verde' }: { onClick: () => void; children: ReactNode; color?: 'verde' | 'azul' }) {
  const c = color === 'verde' ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-700' : 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-800';
  return (
    <button type="button" onClick={onClick} className={`${BOTON_BASE} ${c}`}>
      <span aria-hidden="true" className="text-xl leading-none">+</span>
      {children}
    </button>
  );
}

export function BotonSecundario({ onClick, children, titulo }: { onClick: () => void; children: ReactNode; titulo?: string }) {
  return (
    <button type="button" onClick={onClick} title={titulo} className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-slate-700">
      {children}
    </button>
  );
}

export function BarraFiltros({ children, derecha }: { children: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-gray-800">
      {children}
      {derecha && <div className="ml-auto flex flex-wrap items-center gap-2">{derecha}</div>}
    </div>
  );
}

export function CampoBusqueda({ valor, onCambio, placeholder }: { valor: string; onCambio: (v: string) => void; placeholder: string }) {
  return (
    <label className="min-w-[240px] flex-1 text-xs font-semibold text-slate-500">Buscar
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100"
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
  /** Acciones al final de cada fila (Editar, Ver, Borrar…). */
  acciones?: (f: T) => ReactNode;
  anchoMinimo?: number;
  /** Si viene, al hacer doble clic en una fila se despliega este contenido debajo de ella (otro doble clic lo cierra). */
  detalleFila?: (f: T) => ReactNode;
}

export function TablaListado<T>({ columnas, filas, claveFila, cargando, vacio, acciones, anchoMinimo = 820, detalleFila }: TablaProps<T>) {
  const [abierta, setAbierta] = useState<string | number | null>(null);
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Cargando">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }
  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-600 dark:bg-gray-800">
        <FaInfoCircle className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
        <p className="text-lg text-slate-500">{vacio}</p>
      </div>
    );
  }
  const alinea = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  return (
    // "relative": los textos solo-lectores (.sr-only) son position:absolute y, sin esto, escapan del scroll
    // horizontal y agrandan toda la página en el celular.
    <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
      <table className="w-full border-collapse text-sm" style={{ minWidth: anchoMinimo }}>
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={`px-4 py-3 ${alinea(c.alinear)}`}>{c.titulo}</th>
            ))}
            {(acciones || detalleFila) && <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Acciones</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {filas.map((f) => (
            <Fragment key={claveFila(f)}>
              <tr
                className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/40 ${detalleFila ? 'cursor-pointer select-none' : ''} ${abierta === claveFila(f) ? 'bg-blue-50 dark:bg-slate-700/60' : ''}`}
                {...(detalleFila ? {
                  onDoubleClick: () => { window.getSelection()?.removeAllRanges(); setAbierta((a) => (a === claveFila(f) ? null : claveFila(f))); },
                  title: 'Doble clic para ver el detalle',
                  'aria-expanded': abierta === claveFila(f),
                } : {})}
              >
                {columnas.map((c) => (
                  <td key={c.clave} className={`px-4 py-3 ${alinea(c.alinear)} ${c.sinSalto ? 'whitespace-nowrap' : ''}`}>{c.render(f)}</td>
                ))}
                {(acciones || detalleFila) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {detalleFila && (
                        <button
                          type="button"
                          onClick={() => setAbierta((x) => (x === claveFila(f) ? null : claveFila(f)))}
                          aria-expanded={abierta === claveFila(f)}
                          className={`${BASE_ACCION} border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700`}
                        >
                          <span aria-hidden="true">{abierta === claveFila(f) ? <FaChevronUp /> : <FaChevronDown />}</span>
                          {abierta === claveFila(f) ? 'Ocultar' : 'Ver detalles'}
                        </button>
                      )}
                      {acciones?.(f)}
                    </div>
                  </td>
                )}
              </tr>
              {detalleFila && abierta === claveFila(f) && (
                <tr className="bg-blue-50/60 dark:bg-slate-900/40">
                  <td colSpan={columnas.length + 1} className="p-0">{detalleFila(f)}</td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BASE_ACCION = 'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold';

export function AccionFila({ onClick, icono, texto, tipo = 'primaria', titulo }: { onClick: () => void; icono: ReactNode; texto: string; tipo?: 'primaria' | 'peligro' | 'neutra'; titulo?: string }) {
  const c = tipo === 'primaria' ? 'bg-blue-600 text-white hover:bg-blue-700' : tipo === 'peligro' ? 'border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';
  return (
    <button type="button" onClick={onClick} title={titulo ?? texto} className={`${BASE_ACCION} ${c}`}>
      <span aria-hidden="true">{icono}</span>{texto}
    </button>
  );
}

export function Insignia({ color, children }: { color: 'verde' | 'rojo' | 'ambar' | 'azul' | 'gris'; children: ReactNode }) {
  const c = { verde: 'bg-emerald-100 text-emerald-800', rojo: 'bg-red-100 text-red-700', ambar: 'bg-amber-100 text-amber-800', azul: 'bg-blue-100 text-blue-800', gris: 'bg-slate-100 text-slate-700' }[color];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${c}`}>{children}</span>;
}
