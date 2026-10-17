import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaTags, FaSearch, FaImage, FaPercent, FaEdit, FaTrash, FaBullhorn, FaTimes } from 'react-icons/fa';
import { getCategoryPaginated } from '../../services/categorias';
import { urlImagenProducto } from '../../services/productos';
import {
  aplicarPromocionMasiva, getPromociones, guardarPromocion, limpiarPromociones, quitarPromocion,
  type EstadoPromo, type ProductoPromo,
} from '../../services/promociones';

const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const etiqueta = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';

const ESTADOS: { id: '' | EstadoPromo; nombre: string; color: string }[] = [
  { id: '', nombre: 'Todos', color: 'bg-slate-100 text-slate-700' },
  { id: 'vigente', nombre: 'Vigentes', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'programada', nombre: 'Programadas', color: 'bg-sky-100 text-sky-700' },
  { id: 'vencida', nombre: 'Vencidas', color: 'bg-amber-100 text-amber-700' },
  { id: 'inactiva', nombre: 'Pausadas', color: 'bg-slate-200 text-slate-600' },
  { id: 'sin_promo', nombre: 'Sin promo', color: 'bg-slate-100 text-slate-500' },
];

const gs = (v: any) => `Gs. ${Number(v).toLocaleString('es-PY')}`;
const num = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));
const fechaCorta = (f: string | null) => (f ? f.split('-').reverse().join('/') : '');

const vigenciaTexto = (p: ProductoPromo) => {
  if (p.estado_promo === 'sin_promo') return '';
  if (p.promo_desde && p.promo_hasta) return `Del ${fechaCorta(p.promo_desde)} al ${fechaCorta(p.promo_hasta)}`;
  if (p.promo_hasta) return `Hasta el ${fechaCorta(p.promo_hasta)}`;
  if (p.promo_desde) return `Desde el ${fechaCorta(p.promo_desde)}`;
  return 'Sin fecha de fin';
};

/** Presentaciones del producto: unidad siempre; caja si se vende por caja; pack si tiene precio de pack. */
const presentaciones = (p: ProductoPromo) => {
  const lista: { clave: 'precio_promo' | 'precio_promo_caja' | 'precio_promo_pack'; nombre: string; normal: number | null; promo: number | null }[] = [
    { clave: 'precio_promo', nombre: p.unidad_medida === 'CAJA' ? 'Unidad suelta' : 'Unidad', normal: num(p.precio_venta), promo: num(p.precio_promo) },
  ];
  if (p.unidad_medida === 'CAJA') lista.push({ clave: 'precio_promo_caja', nombre: `Caja${p.cant_p_caja ? ` (x${p.cant_p_caja})` : ''}`, normal: num(p.precio_venta_caja), promo: num(p.precio_promo_caja) });
  if (Number(p.precio_venta_pack) > 0) lista.push({ clave: 'precio_promo_pack', nombre: `Pack${p.cant_p_pack ? ` (x${p.cant_p_pack})` : ''}`, normal: num(p.precio_venta_pack), promo: num(p.precio_promo_pack) });
  return lista;
};

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{titulo}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><FaTimes /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Módulo de promociones: precio promo por presentación (unidad, caja, pack) con vigencia. */
export default function Promociones() {
  const [estado, setEstado] = useState<'' | EstadoPromo>('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<{ data: ProductoPromo[]; totalPages: number; totalItems: number; resumen: Record<EstadoPromo, number> }>({ data: [], totalPages: 1, totalItems: 0, resumen: { vigente: 0, programada: 0, vencida: 0, inactiva: 0, sin_promo: 0 } });
  const [cargando, setCargando] = useState(false);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [editando, setEditando] = useState<ProductoPromo | null>(null);
  const [masiva, setMasiva] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await getPromociones({ page: pagina, limit: 8, search: busqueda.trim(), estado: estado || undefined });
      setDatos({ data: r.data.data, totalPages: r.data.totalPages || 1, totalItems: r.data.totalItems, resumen: r.data.resumen });
    } catch {
      setMensaje({ ok: false, texto: 'No se pudieron cargar las promociones' });
    } finally { setCargando(false); }
  }, [pagina, busqueda, estado]);

  useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [cargar]);
  useEffect(() => { setPagina(1); }, [busqueda, estado]);

  const avisar = (ok: boolean, texto: string) => { setMensaje({ ok, texto }); setTimeout(() => setMensaje(null), 5000); };
  const alternar = (id: number) => setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const idsPagina = useMemo(() => datos.data.map((p) => p.idproducto), [datos.data]);
  const todosMarcados = idsPagina.length > 0 && idsPagina.every((id) => seleccion.includes(id));

  const quitar = async (p: ProductoPromo) => {
    if (!window.confirm(`¿Quitar la promoción de "${p.nombre_producto}"?`)) return;
    try { await quitarPromocion(p.idproducto); avisar(true, 'Promoción quitada'); cargar(); }
    catch (e: any) { avisar(false, e.response?.data?.message || 'No se pudo quitar la promoción'); }
  };
  const limpiar = async (estadoLimpiar: 'vencida' | 'todas') => {
    if (!window.confirm(estadoLimpiar === 'vencida' ? '¿Quitar todas las promociones vencidas?' : '¿Quitar las promociones de los productos seleccionados?')) return;
    try {
      const r = await limpiarPromociones(estadoLimpiar === 'vencida' ? { estado: 'vencida' } : { ids: seleccion });
      avisar(true, r.data.message); setSeleccion([]); cargar();
    } catch (e: any) { avisar(false, e.response?.data?.message || 'No se pudo completar'); }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white shadow-lg">
        <FaTags className="text-3xl" />
        <div className="flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">Promociones</h1>
          <p className="text-sm opacity-90">Precios promocionales por unidad, caja y pack, con fechas. En la venta, el cajero elige si aplica el precio promo con el botón «Aplicar promo». También sale en los flyers.</p>
        </div>
        <a href="#/publicidad" className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/30"><FaBullhorn /> Crear flyer</a>
      </div>

      {mensaje && <div className={`mb-4 rounded-lg px-4 py-2 text-sm font-semibold ${mensaje.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>{mensaje.texto}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const n = e.id ? datos.resumen[e.id] : Object.values(datos.resumen).reduce((a, b) => a + b, 0);
          return (
            <button key={e.id || 'todos'} type="button" onClick={() => setEstado(e.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${e.color} ${estado === e.id ? 'ring-2 ring-emerald-600 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}>
              {e.nombre} <span className="ml-1 rounded-full bg-white/70 px-2 text-xs">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative min-w-[220px] flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${input} pl-9`} placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={todosMarcados} onChange={() => setSeleccion((s) => (todosMarcados ? s.filter((id) => !idsPagina.includes(id)) : [...new Set([...s, ...idsPagina])]))} />
          Marcar página
        </label>
        <button type="button" onClick={() => setMasiva(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <FaPercent /> Aplicar descuento{seleccion.length ? ` a ${seleccion.length}` : ''}
        </button>
        {seleccion.length > 0 && <button type="button" onClick={() => limpiar('todas')} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Quitar promo a {seleccion.length}</button>}
        {datos.resumen.vencida > 0 && <button type="button" onClick={() => limpiar('vencida')} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50">Limpiar vencidas ({datos.resumen.vencida})</button>}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {datos.data.map((p) => {
          const e = ESTADOS.find((x) => x.id === p.estado_promo)!;
          return (
            <div key={p.idproducto} className={`min-w-0 rounded-2xl border-2 bg-white p-3 shadow-sm dark:bg-slate-900 ${seleccion.includes(p.idproducto) ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={seleccion.includes(p.idproducto)} onChange={() => alternar(p.idproducto)} />
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {p.imagen ? <img src={urlImagenProducto(p.imagen)} alt="" className="h-full w-full object-cover" /> : <FaImage className="text-slate-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{p.nombre_producto}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${e.color}`}>{e.nombre === 'Todos' ? '' : e.nombre.replace(/s$/, '')}</span>
                  </div>
                  <p className="text-xs text-slate-500">{p.categoria || 'Sin categoría'}{p.promo_titulo ? ` · ${p.promo_titulo}` : ''}</p>
                  {vigenciaTexto(p) && <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{vigenciaTexto(p)}</p>}
                </div>
              </div>
              <div className="mt-2 grid gap-1">
                {presentaciones(p).map((pr) => (
                  <div key={pr.clave} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{pr.nombre}</span>
                    {pr.promo ? (
                      <span><span className="mr-2 text-xs text-slate-400 line-through">{pr.normal !== null ? gs(pr.normal) : ''}</span><span className="font-bold text-emerald-700">{gs(pr.promo)}</span>
                        {pr.normal ? <span className="ml-2 rounded bg-rose-100 px-1.5 text-[11px] font-bold text-rose-600">-{Math.round((1 - pr.promo / pr.normal) * 100)}%</span> : null}</span>
                    ) : (
                      <span className="text-slate-500">{pr.normal !== null ? gs(pr.normal) : '—'} <span className="text-xs">(sin promo)</span></span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setEditando(p)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><FaEdit /> {p.estado_promo === 'sin_promo' ? 'Crear promo' : 'Editar promo'}</button>
                {p.estado_promo !== 'sin_promo' && <button type="button" onClick={() => quitar(p)} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><FaTrash /> Quitar</button>}
              </div>
            </div>
          );
        })}
        {!datos.data.length && !cargando && <p className="col-span-full rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No hay productos en este estado.</p>}
      </div>

      {datos.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((x) => x - 1)} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Anterior</button>
          <span className="text-sm text-slate-600">Página {pagina} de {datos.totalPages}</span>
          <button type="button" disabled={pagina >= datos.totalPages} onClick={() => setPagina((x) => x + 1)} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Siguiente</button>
        </div>
      )}

      {editando && <ModalEditarPromo producto={editando} onClose={() => setEditando(null)} onGuardado={() => { setEditando(null); avisar(true, 'Promoción guardada'); cargar(); }} />}
      {masiva && <ModalMasiva seleccion={seleccion} onClose={() => setMasiva(false)} onAplicado={(t) => { setMasiva(false); setSeleccion([]); avisar(true, t); cargar(); }} />}
    </div>
  );
}

// ───────── Editar la promo de un producto (todas sus presentaciones) ─────────
function ModalEditarPromo({ producto, onClose, onGuardado }: { producto: ProductoPromo; onClose: () => void; onGuardado: () => void }) {
  const pres = presentaciones(producto);
  const [precios, setPrecios] = useState<Record<string, string>>({
    precio_promo: producto.precio_promo ? String(Number(producto.precio_promo)) : '',
    precio_promo_caja: producto.precio_promo_caja ? String(Number(producto.precio_promo_caja)) : '',
    precio_promo_pack: producto.precio_promo_pack ? String(Number(producto.precio_promo_pack)) : '',
  });
  const [desde, setDesde] = useState(producto.promo_desde || '');
  const [hasta, setHasta] = useState(producto.promo_hasta || '');
  const [titulo, setTitulo] = useState(producto.promo_titulo || '');
  const [activa, setActiva] = useState(producto.promo_activa !== 0);
  const [pct, setPct] = useState('');
  const [pcts, setPcts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const calcular = () => {
    const d = Number(pct);
    if (!(d >= 1 && d <= 99)) { setError('Poné un descuento entre 1 y 99 %'); return; }
    setError('');
    const nuevo: Record<string, string> = { ...precios };
    pres.forEach((p) => { if (p.normal) nuevo[p.clave] = String(Math.round(p.normal * (1 - d / 100) * 100) / 100); });
    setPrecios(nuevo);
  };

  const guardar = async () => {
    setError(''); setGuardando(true);
    try {
      await guardarPromocion(producto.idproducto, {
        precio_promo: precios.precio_promo || null,
        precio_promo_caja: pres.some((p) => p.clave === 'precio_promo_caja') ? precios.precio_promo_caja || null : null,
        precio_promo_pack: pres.some((p) => p.clave === 'precio_promo_pack') ? precios.precio_promo_pack || null : null,
        promo_desde: desde || null, promo_hasta: hasta || null, promo_activa: activa, promo_titulo: titulo || null,
      });
      onGuardado();
    } catch (e: any) { setError(e.response?.data?.message || 'No se pudo guardar'); }
    finally { setGuardando(false); }
  };

  return (
    <Modal titulo={`Promoción · ${producto.nombre_producto}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-end gap-2 rounded-lg bg-emerald-50 p-3">
          <div className="flex-1">
            <label className={etiqueta}>Calcular con un descuento (%)</label>
            <input className={input} type="number" min={1} max={99} value={pct} onChange={(e) => setPct(e.target.value)} placeholder="Ej: 15" />
          </div>
          <button type="button" onClick={calcular} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Calcular</button>
        </div>
        {pres.map((p) => {
          const val = Number(precios[p.clave]);
          const ahorro = p.normal && val > 0 ? Math.round((1 - val / p.normal) * 100) : null;
          return (
            <div key={p.clave}>
              <label className={etiqueta}>Precio promo · {p.nombre} <span className="font-normal text-slate-400">(normal {p.normal !== null ? gs(p.normal) : '—'})</span></label>
              <div className="flex items-center gap-2">
                <input className={input} type="number" min={0} value={precios[p.clave]} onChange={(e) => { setPcts((s) => ({ ...s, [p.clave]: '' })); setPrecios((s) => ({ ...s, [p.clave]: e.target.value })); }} placeholder="Precio directo (sin promo si está vacío)" aria-label={`Precio promo ${p.nombre}`} />
                <span className="text-sm text-slate-400">o</span>
                <div className="relative w-28 shrink-0">
                  <input className={`${input} pr-7`} type="number" min={1} max={99} value={pcts[p.clave] || ''} placeholder="% desc." aria-label={`Descuento % ${p.nombre}`}
                    onChange={(e) => { const d = Number(e.target.value); setPcts((s) => ({ ...s, [p.clave]: e.target.value })); if (p.normal && d >= 1 && d <= 99) setPrecios((s) => ({ ...s, [p.clave]: String(Math.round(p.normal! * (1 - d / 100) * 100) / 100) })); }} />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>
              {ahorro !== null && <p className={`mt-0.5 text-xs font-semibold ${ahorro > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{ahorro > 0 ? `Ahorro del ${ahorro}% sobre el precio normal` : 'El precio promo debe ser menor al normal'}</p>}
            </div>
          );
        })}
        <div className="grid grid-cols-2 gap-3">
          <div><label className={etiqueta}>Desde (opcional)</label><input className={input} type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><label className={etiqueta}>Hasta (opcional)</label><input className={input} type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
        <div><label className={etiqueta}>Nombre de la promo (opcional)</label><input className={input} maxLength={40} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Fin de semana, Liquidación" /></div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} /> Promoción activa (si la pausás, no se ofrece en ventas ni flyers)</label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-bold">Cancelar</button>
          <button type="button" disabled={guardando} onClick={guardar} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Guardando…' : 'Guardar promoción'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ───────── Descuento masivo (productos marcados o una categoría) ─────────
function ModalMasiva({ seleccion, onClose, onAplicado }: { seleccion: number[]; onClose: () => void; onAplicado: (t: string) => void }) {
  const [alcance, setAlcance] = useState<'seleccion' | 'categoria'>(seleccion.length ? 'seleccion' : 'categoria');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [idcategoria, setIdcategoria] = useState('');
  const [pct, setPct] = useState('10');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [titulo, setTitulo] = useState('');
  const [error, setError] = useState('');
  const [aplicando, setAplicando] = useState(false);

  useEffect(() => { getCategoryPaginated({ page: 1, limit: 100 }).then((r) => setCategorias(r.data?.data ?? [])).catch(() => setCategorias([])); }, []);

  const aplicar = async () => {
    setError('');
    if (alcance === 'seleccion' && !seleccion.length) { setError('Marcá productos en la lista'); return; }
    if (alcance === 'categoria' && !idcategoria) { setError('Elegí una categoría'); return; }
    if (!window.confirm('Esto reemplaza la promoción actual de esos productos. ¿Continuar?')) return;
    setAplicando(true);
    try {
      const r = await aplicarPromocionMasiva({ ...(alcance === 'seleccion' ? { ids: seleccion } : { idcategoria: Number(idcategoria) }), porcentaje: Number(pct), promo_desde: desde || null, promo_hasta: hasta || null, promo_titulo: titulo || null });
      onAplicado(r.data.message);
    } catch (e: any) { setError(e.response?.data?.message || 'No se pudo aplicar'); }
    finally { setAplicando(false); }
  };

  return (
    <Modal titulo="Aplicar descuento a varios productos" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">El mismo porcentaje se aplica a cada presentación del producto (unidad, caja y pack).</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAlcance('seleccion')} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold ${alcance === 'seleccion' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : ''}`}>Productos marcados ({seleccion.length})</button>
          <button type="button" onClick={() => setAlcance('categoria')} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold ${alcance === 'categoria' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : ''}`}>Una categoría</button>
        </div>
        {alcance === 'categoria' && (
          <select className={input} value={idcategoria} onChange={(e) => setIdcategoria(e.target.value)}>
            <option value="">Elegí la categoría…</option>
            {categorias.map((c) => <option key={c.idcategorias} value={c.idcategorias}>{c.categoria}</option>)}
          </select>
        )}
        <div><label className={etiqueta}>Descuento (%)</label><input className={input} type="number" min={1} max={99} value={pct} onChange={(e) => setPct(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={etiqueta}>Desde (opcional)</label><input className={input} type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><label className={etiqueta}>Hasta (opcional)</label><input className={input} type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
        <div><label className={etiqueta}>Nombre de la promo (opcional)</label><input className={input} maxLength={40} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Semana del cliente" /></div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-bold">Cancelar</button>
          <button type="button" disabled={aplicando} onClick={aplicar} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{aplicando ? 'Aplicando…' : 'Aplicar descuento'}</button>
        </div>
      </div>
    </Modal>
  );
}
