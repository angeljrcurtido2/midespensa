import InfoFarmaciaProducto from './InfoFarmaciaProducto';
import { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { getProductosPaginated } from '../services/productos';
import { useLectorCelular } from '../hooks/useLectorCelular';

export type PresentacionElegida = 'unidad' | 'pack' | 'caja' | 'elegir';

interface Props {
  /** venta: muestra stock y precios por presentación (unidad / pack / caja). compra: un solo botón "Agregar". */
  modo: 'venta' | 'compra';
  onElegir: (producto: any, presentacion: PresentacionElegida) => void;
  placeholder?: string;
}

const gs = (n: unknown) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;

/**
 * Buscador de productos dentro de la misma pantalla: se escribe el nombre o se escanea el código y aparecen las
 * coincidencias ahí mismo, con un botón por presentación. Reemplaza la ventana emergente de "Seleccionar producto".
 */
export default function BuscadorProducto({ modo, onElegir, placeholder }: Props) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  // Código que llegó desde el celular: al terminar la búsqueda, si es exacto, el producto se elige solo.
  const autoElegir = useRef(false);

  useLectorCelular(
    (codigo) => {
      autoElegir.current = true;
      setTexto(codigo);
    },
    () => (entrada.current?.getClientRects().length ?? 0) > 0,
  );

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 1) {
      setResultados([]);
      setAviso('');
      return;
    }
    let vigente = true;
    const t = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await getProductosPaginated({ page: 1, limit: 8, search: q, ...(modo === 'venta' ? { para_venta: 1 as const } : {}) });
        const body = r.data;
        const lista = Array.isArray(body) ? body : body?.data || body?.productos || [];
        if (!vigente) return;
        setResultados(lista);
        setAviso(lista.length === 0 ? 'No se encontraron productos con ese nombre o código.' : '');
        setAbierto(true);
        if (autoElegir.current) {
          autoElegir.current = false;
          const exacto = lista.find((p: any) => String(p.cod_barra ?? '').trim() === q);
          if (!exacto) setAviso(`Código ${q} recibido del celular, pero no hay un producto con ese código.`);
          else if (modo === 'venta' && Number(exacto.stock) <= 0) setAviso(`${exacto.nombre_producto}: sin stock.`);
          else {
            const pres = presentaciones(exacto);
            elegir(exacto, pres.length === 1 ? pres[0].clave : 'elegir');
          }
        }
      } catch {
        if (vigente) setAviso('No se pudo buscar. Probá de nuevo.');
      } finally {
        if (vigente) setCargando(false);
      }
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [texto, modo]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  const elegir = (p: any, pres: PresentacionElegida) => {
    onElegir(p, pres);
    setTexto('');
    setResultados([]);
    setAbierto(false);
    entrada.current?.focus();
  };

  const presentaciones = (p: any): { clave: PresentacionElegida; etiqueta: string; precio: unknown }[] => {
    if (modo === 'compra') return [{ clave: 'elegir', etiqueta: 'Agregar', precio: p.precio_compra ?? p.lote_pr_compr_rec }];
    const unidad = String(p.unidad_medida || '').toUpperCase();
    if (['KG', 'L', 'LITRO'].includes(unidad)) return [{ clave: 'elegir', etiqueta: unidad === 'KG' ? 'Kilos / gramos' : 'Litros / ml', precio: p.precio_venta }];
    const lista: { clave: PresentacionElegida; etiqueta: string; precio: unknown }[] = [{ clave: 'unidad', etiqueta: 'Unidad', precio: p.precio_venta }];
    if (Number(p.cant_p_pack) > 0) lista.push({ clave: 'pack', etiqueta: `Pack/blíster ×${p.cant_p_pack}`, precio: p.precio_venta_pack });
    if (unidad === 'CAJA' && Number(p.cant_p_caja) > 0) lista.push({ clave: 'caja', etiqueta: `Caja ×${p.cant_p_caja}`, precio: p.precio_venta_caja });
    return lista;
  };

  const alEnter = () => {
    if (!resultados.length) return;
    const q = texto.trim();
    const exacto = resultados.find((p) => String(p.cod_barra ?? '').trim() === q);
    const p = exacto ?? (resultados.length === 1 ? resultados[0] : null);
    if (!p) return;
    if (modo === 'venta' && Number(p.stock) <= 0) return;
    const pres = presentaciones(p);
    elegir(p, pres.length === 1 ? pres[0].clave : 'elegir');
  };

  return (
    <div ref={caja} className="relative">
      <label htmlFor={`buscador-${modo}`} className="sr-only">Buscar producto por nombre o código de barras</label>
      <div className="flex items-center gap-3 rounded-xl border-2 border-blue-300 bg-white px-4 py-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 dark:border-slate-600 dark:bg-slate-800">
        <FaSearch className="flex-none text-blue-500" aria-hidden="true" />
        <input
          id={`buscador-${modo}`}
          ref={entrada}
          type="text"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              alEnter();
            } else if (e.key === 'Escape') setAbierto(false);
          }}
          placeholder={placeholder ?? 'Buscá un producto por nombre o escaneá el código de barras…'}
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
        {cargando && <span className="text-xs text-slate-400" aria-live="polite">Buscando…</span>}
      </div>

      {abierto && (resultados.length > 0 || aviso) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-800" role="listbox">
          {aviso && <p className="p-4 text-sm text-slate-500">{aviso}</p>}
          {resultados.map((p) => {
            const sinStock = modo === 'venta' && Number(p.stock) <= 0;
            return (
              <div key={p.idproducto} className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-700">
                <div className="min-w-[180px] flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{p.nombre_producto}</p>
                  <InfoFarmaciaProducto producto={p} />
                  <p className="text-xs text-slate-500">
                    {p.cod_barra ? `Código ${p.cod_barra} · ` : ''}
                    {modo === 'venta' ? (sinStock ? <span className="font-semibold text-red-600">Sin stock</span> : `Stock ${p.stock}`) : `${p.unidad_medida ?? ''}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presentaciones(p).map((pr) => (
                    <button
                      key={pr.clave + pr.etiqueta}
                      type="button"
                      disabled={sinStock}
                      onClick={() => elegir(p, pr.clave)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <span className="block">{pr.etiqueta}</span>
                      {pr.precio != null && pr.precio !== '' && <span className="block text-xs font-normal text-blue-100">{gs(pr.precio)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
