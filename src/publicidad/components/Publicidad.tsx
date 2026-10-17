import { useEffect, useMemo, useState } from 'react';
import { FaBullhorn, FaDownload, FaSearch, FaShareAlt, FaWhatsapp, FaImage, FaArrowsAlt, FaMagic, FaUndo } from 'react-icons/fa';
import { getProductosPaginated, urlImagenProducto } from '../../services/productos';
import { generarFlyer, generarFlyerEditable, getPlantillasFlyer, type CajaPieza, type ExtraFlyer, type FormaLogo, type FormatoFlyer, type LayoutFlyer, type OpcionesFlyer, type PlantillaFlyer } from '../../services/publicidad';
import EditorFlyer from './EditorFlyer';
import PanelLogo from './PanelLogo';
import PanelExtras, { nombreExtra, nuevoExtra } from './PanelExtras';

const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const etiqueta = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';

const nombreArchivo = (nombre: string) =>
  `flyer-${nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 40)}.png`;

/**
 * Publicidad de productos: se elige el producto y una plantilla, se completan el precio de oferta, el título
 * y los datos de contacto, y el servidor arma el flyer (PNG) listo para compartir por WhatsApp.
 * No usa IA: la plantilla toma la foto, el nombre y el precio del producto.
 */
export default function Publicidad() {
  const [plantillas, setPlantillas] = useState<PlantillaFlyer[]>([]);
  const [formatos, setFormatos] = useState<FormatoFlyer[]>([]);
  const [muestras, setMuestras] = useState<Record<string, string>>({});
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [producto, setProducto] = useState<any | null>(null);
  const [plantilla, setPlantilla] = useState('');
  const [formato, setFormato] = useState('post');
  const [tipoOferta, setTipoOferta] = useState<'promo' | 'descuento' | 'precio'>('descuento');
  const [descuento, setDescuento] = useState('15');
  const [precioOferta, setPrecioOferta] = useState('');
  const [titulo, setTitulo] = useState('');
  const [vigencia, setVigencia] = useState('');
  const [telefono, setTelefono] = useState(() => { try { return localStorage.getItem('publicidad_telefono') || ''; } catch { return ''; } });
  const [mostrarEmpresa, setMostrarEmpresa] = useState(true);
  // Diseño: foto sin fondo, logo y piezas movidas por el usuario (mover y agrandar con el editor).
  const [quitarFondo, setQuitarFondo] = useState(false);
  const [tolerancia, setTolerancia] = useState(38);
  const [mostrarLogo, setMostrarLogo] = useState(true);
  const [logoPastilla, setLogoPastilla] = useState<'auto' | 'blanca' | 'oscura' | 'ninguna'>('auto');
  const [layout, setLayoutRaw] = useState<LayoutFlyer>({});
  const [extras, setExtrasRaw] = useState<ExtraFlyer[]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [logoForma, setLogoForma] = useState<FormaLogo>('redondeado');
  const [logoColor, setLogoColor] = useState<string | null>(null);
  const [logoRelleno, setLogoRelleno] = useState(false);
  const [logoAtras, setLogoAtras] = useState(false);
  const [logoHuecos, setLogoHuecos] = useState(false);
  type Snap = { layout: LayoutFlyer; extras: ExtraFlyer[] };
  const [pasado, setPasado] = useState<Snap[]>([]);
  const [futuro, setFuturo] = useState<Snap[]>([]);
  // Cada cambio de posición, texto o forma guarda el estado anterior para poder deshacer y rehacer.
  const confirmar = (n: Partial<Snap>) => { setPasado((p) => [...p.slice(-49), { layout, extras }]); setFuturo([]); if (n.layout) setLayoutRaw(n.layout); if (n.extras) setExtrasRaw(n.extras); };
  const setLayout = (l: LayoutFlyer) => confirmar({ layout: l });
  const setExtras = (e: ExtraFlyer[]) => confirmar({ extras: e });
  const aplicarSnap = (x: Snap) => { setLayoutRaw(x.layout); setExtrasRaw(x.extras); };
  const deshacer = () => { if (!pasado.length) return; setFuturo((f) => [{ layout, extras }, ...f]); aplicarSnap(pasado[pasado.length - 1]); setPasado((p) => p.slice(0, -1)); };
  const rehacer = () => { if (!futuro.length) return; setPasado((p) => [...p, { layout, extras }]); aplicarSnap(futuro[0]); setFuturo((f) => f.slice(1)); };
  const agregarExtra = (tipo: 'texto' | 'forma') => { const e = nuevoExtra(tipo); setExtras([...extras, e]); setEditando(true); setSeleccion(`x_${e.id}`); };
  /** Mueve o cambia de tamaño un extra: dx/dy en píxeles del flyer, f = factor de tamaño alrededor del centro. */
  const moverExtra = (id: string, dx: number, dy: number, f: number) => setExtras(extras.map((e) => (e.id !== id ? e : {
    ...e, x: e.x + dx / dimensiones.ancho, y: e.y + dy / dimensiones.alto,
    ...(e.tipo === 'texto' ? { tam: Math.max(0.015, Math.min(0.3, e.tam * f)) } : { w: Math.max(0.01, Math.min(1.5, e.w * f)), h: Math.max(0.003, Math.min(1.5, e.h * f)) }),
  })));
  const [editando, setEditando] = useState(false);
  const [elementos, setElementos] = useState<Record<string, CajaPieza>>({});
  const [dimensiones, setDimensiones] = useState({ ancho: 1080, alto: 1350 });
  const [avisos, setAvisos] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [vista, setVista] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [armando, setArmando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlantillasFlyer().then((r) => { setPlantillas(r.data.plantillas); setFormatos(r.data.formatos); setPlantilla((actual) => (r.data.plantillas.some((p) => p.id === actual) ? actual : r.data.plantillas[0]?.id || '')); }).catch(() => setError('No se pudieron cargar las plantillas'));
  }, []);

  // Miniaturas de las plantillas (con datos de ejemplo).
  useEffect(() => {
    if (!plantillas.length) return;
    let cancelado = false;
    plantillas.forEach((p) => {
      generarFlyer({ muestra: true, plantilla: p.id, formato: 'post', descuento: 20 })
        .then((r) => { if (!cancelado) setMuestras((m) => ({ ...m, [p.id]: URL.createObjectURL(r.data) })); })
        .catch(() => {});
    });
    return () => { cancelado = true; };
  }, [plantillas]);

  // Buscador de productos.
  useEffect(() => {
    const t = setTimeout(() => {
      getProductosPaginated({ page: 1, limit: 8, search: busqueda, para_venta: 1 }).then((r) => setProductos(r.data?.data ?? [])).catch(() => setProductos([]));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const opciones = useMemo<OpcionesFlyer | null>(() => {
    if (!producto || !plantilla) return null;
    const o: OpcionesFlyer = { idproducto: producto.idproducto, plantilla, formato, mostrar_empresa: mostrarEmpresa, mostrar_logo: mostrarLogo, logo_pastilla: logoPastilla, logo_forma: logoForma };
    if (logoColor) o.logo_color = logoColor;
    if (logoRelleno) o.logo_relleno = true;
    if (logoAtras) o.logo_atras = true;
    if (logoHuecos) o.logo_huecos = true;
    if (extras.length) o.extras = extras;
    if (quitarFondo) { o.quitar_fondo = true; o.tolerancia = tolerancia; }
    if (Object.keys(layout).length) o.layout = layout;
    if (tipoOferta === 'descuento' && descuento) o.descuento = descuento;
    if (tipoOferta === 'precio' && precioOferta) o.precio_oferta = precioOferta;
    if (titulo.trim()) o.titulo = titulo.trim();
    if (vigencia.trim()) o.vigencia = vigencia.trim();
    if (telefono.trim()) o.telefono = telefono.trim();
    return o;
  }, [producto, plantilla, formato, tipoOferta, descuento, precioOferta, titulo, vigencia, telefono, mostrarEmpresa, mostrarLogo, logoPastilla, logoForma, logoColor, logoRelleno, logoAtras, logoHuecos, extras, quitarFondo, tolerancia, layout]);

  // Las posiciones valen para una plantilla y un tamaño: al cambiarlos (o de producto) se vuelve a empezar.
  useEffect(() => { setLayoutRaw({}); setPasado([]); setFuturo([]); setSeleccion(null); }, [producto?.idproducto, plantilla, formato]);

  // Vista previa en vivo.
  useEffect(() => {
    if (!opciones) return;
    setArmando(true);
    const t = setTimeout(() => {
      generarFlyerEditable(opciones)
        .then(async (r) => {
          const d = r.data;
          const url = `data:image/png;base64,${d.base64}`;
          setError('');
          setVista(url);
          setBlob(await (await fetch(url)).blob());
          setElementos(d.elementos || {});
          setDimensiones({ ancho: d.ancho, alto: d.alto });
          setAvisos(d.avisos || []);
          setVersion((v) => v + 1);
        })
        .catch((e) => {
          setError(e?.response?.data?.message || 'No se pudo armar el flyer'); setBlob(null); setVista(''); setElementos({});
        })
        .finally(() => setArmando(false));
    }, 450);
    return () => clearTimeout(t);
  }, [opciones]);

  useEffect(() => { try { localStorage.setItem('publicidad_telefono', telefono); } catch { /* sin almacenamiento */ } }, [telefono]);

  const descargar = () => {
    if (!blob || !producto) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivo(producto.nombre_producto);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const compartir = async () => {
    if (!blob || !producto) return;
    const archivo = new File([blob], nombreArchivo(producto.nombre_producto), { type: 'image/png' });
    const nav: any = navigator;
    if (nav.canShare?.({ files: [archivo] })) {
      try { await nav.share({ files: [archivo], title: producto.nombre_producto }); } catch { /* el usuario canceló */ }
      return;
    }
    // Sin "compartir archivos" (computadora): se descarga y se abre WhatsApp Web para adjuntarla.
    descargar();
    window.open('https://web.whatsapp.com/', '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-5 text-white shadow-lg">
        <FaBullhorn className="text-3xl" />
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Publicidad de productos</h1>
          <p className="text-sm opacity-90">Armá un flyer de oferta con la foto y el precio de tu producto y compartilo por WhatsApp.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* 1. Producto */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-100">1. Elegí el producto</h2>
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${input} pl-9`} placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {productos.map((p) => (
                <button type="button" key={p.idproducto} onClick={() => { setProducto(p); setTipoOferta(p.en_promo && p.promo_unidad ? 'promo' : (t) => (t === 'promo' ? 'descuento' : t) as any); }}
                  className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left transition ${producto?.idproducto === p.idproducto ? 'border-rose-500 bg-rose-50 dark:bg-slate-800' : 'border-slate-200 hover:border-rose-300 dark:border-slate-700'}`}>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                    {p.imagen ? <img src={urlImagenProducto(p.imagen)} alt="" className="h-full w-full object-cover" /> : <FaImage className="text-slate-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{p.nombre_producto}</p>
                    <p className="text-xs text-slate-500">Gs. {Number(p.precio_venta).toLocaleString('es-PY')}{p.en_promo && ' · en promo'}{!p.imagen && ' · sin foto'}</p>
                  </div>
                </button>
              ))}
              {!productos.length && <p className="text-sm text-slate-500">No hay productos para mostrar.</p>}
            </div>
            {producto && !producto.imagen && (
              <p className="mt-2 text-xs font-semibold text-amber-600">Este producto no tiene foto: el flyer saldrá con un recuadro vacío. Subila desde Productos → Editar.</p>
            )}
          </section>

          {/* 2. Plantilla */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-100">2. Elegí la plantilla</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {plantillas.map((p) => (
                <button type="button" key={p.id} onClick={() => setPlantilla(p.id)} title={p.descripcion}
                  className={`overflow-hidden rounded-xl border-2 text-left ${plantilla === p.id ? 'border-rose-500 shadow-md' : 'border-slate-200 dark:border-slate-700'}`}>
                  {muestras[p.id] ? <img src={muestras[p.id]} alt={p.nombre} className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] w-full animate-pulse bg-slate-200" />}
                  <p className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-100">{p.nombre}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 max-w-xs">
              <label className={etiqueta}>Tamaño</label>
              <select className={input} value={formato} onChange={(e) => setFormato(e.target.value)}>
                {formatos.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </div>
          </section>

          {/* 3. Datos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-100">3. Completá la oferta</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={etiqueta}>Cómo querés mostrar la oferta</label>
                <select className={input} value={tipoOferta} onChange={(e) => setTipoOferta(e.target.value as 'promo' | 'descuento' | 'precio')}>
                  <option value="promo" disabled={!producto?.promo_unidad}>Precio promo del producto</option>
                  <option value="descuento">Porcentaje de descuento</option>
                  <option value="precio">Precio de oferta</option>
                </select>
              </div>
              <div>
                {tipoOferta === 'promo' ? (
                  <>
                    <label className={etiqueta}>Promoción vigente del producto</label>
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                      {producto?.en_promo && producto.promo_unidad ? `Gs. ${Number(producto.promo_unidad).toLocaleString('es-PY')} (antes Gs. ${Number(producto.precio_venta).toLocaleString('es-PY')})${producto.promo_titulo ? ' · ' + producto.promo_titulo : ''}` : 'Este producto no tiene una promoción vigente: cargala en Promociones.'}
                    </p>
                  </>
                ) : tipoOferta === 'descuento' ? (
                  <>
                    <label className={etiqueta}>Descuento (%)</label>
                    <input className={input} type="number" min={1} max={99} value={descuento} onChange={(e) => setDescuento(e.target.value)} />
                  </>
                ) : (
                  <>
                    <label className={etiqueta}>Precio de oferta (Gs.)</label>
                    <input className={input} type="number" min={1} value={precioOferta} onChange={(e) => setPrecioOferta(e.target.value)} placeholder={producto ? `Menos de ${Number(producto.precio_venta).toLocaleString('es-PY')}` : ''} />
                  </>
                )}
              </div>
              <div>
                <label className={etiqueta}>Título (opcional)</label>
                <input className={input} maxLength={22} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="OFERTA" />
              </div>
              <div>
                <label className={etiqueta}>Vigencia (opcional)</label>
                <input className={input} maxLength={60} value={vigencia} onChange={(e) => setVigencia(e.target.value)} placeholder="Hasta el domingo" />
              </div>
              <div>
                <label className={etiqueta}>WhatsApp / teléfono (opcional)</label>
                <input className={input} maxLength={25} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="0983 000 000" />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={mostrarEmpresa} onChange={(e) => setMostrarEmpresa(e.target.checked)} />
                Mostrar el nombre de mi empresa
              </label>
            </div>
          </section>

          {/* 4. Diseño: foto sin fondo, logo y posiciones */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-100">4. Ajustá el diseño <span className="font-normal text-slate-500">(opcional)</span></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={quitarFondo} onChange={(e) => setQuitarFondo(e.target.checked)} />
                  <FaMagic className="text-rose-500" /> Quitar el fondo blanco de la foto
                </label>
                <p className="mt-1 text-xs text-slate-500">El producto queda recortado (PNG transparente) sobre los colores de la plantilla. Funciona con fotos de fondo blanco parejo.</p>
                {quitarFondo && (
                  <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Fuerza
                    <input type="range" min={10} max={80} value={tolerancia} onChange={(e) => setTolerancia(Number(e.target.value))} className="flex-1" aria-label="Qué tanto se parece al fondo para borrarlo" />
                    <span className="w-8 text-right">{tolerancia}</span>
                  </label>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={mostrarLogo} onChange={(e) => setMostrarLogo(e.target.checked)} /> Mostrar el logo de mi empresa
                </label>
                <div className={`mt-2 ${mostrarLogo ? '' : 'opacity-50'}`}>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fondo del logo</span>
                  <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Fondo del logo">
                    {([['auto', 'Automático'], ['blanca', 'Blanco'], ['oscura', 'Oscuro'], ['ninguna', 'Sin fondo']] as const).map(([v, t]) => (
                      <button key={v} type="button" role="radio" aria-checked={logoPastilla === v} disabled={!mostrarLogo} onClick={() => setLogoPastilla(v)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${logoPastilla === v ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className={`mt-2 ${mostrarLogo ? '' : 'opacity-50'}`}>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Forma</span>
                  <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Forma del logo">
                    {([['redondeado', 'Redondeado'], ['redondo', 'Círculo'], ['cuadrado', 'Cuadrado'], ['rectangulo', 'Rectángulo']] as const).map(([v, t]) => (
                      <button key={v} type="button" role="radio" aria-checked={logoForma === v} disabled={!mostrarLogo} onClick={() => setLogoForma(v)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${logoForma === v ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200'}`}>{t}</button>
                    ))}
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Color de fondo
                    <input type="color" disabled={!mostrarLogo} value={logoColor || '#ffffff'} onChange={(e) => setLogoColor(e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-slate-300" aria-label="Color de fondo del logo" />
                    {logoColor && <button type="button" onClick={() => setLogoColor(null)} className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-semibold hover:bg-slate-50">Quitar color</button>}
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-500">El logo se carga una vez en Gestión → Facturador. «Automático» elige el fondo según los colores del diseño.</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 sm:col-span-2 dark:border-rose-900 dark:bg-slate-800">
                <p className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-300"><FaArrowsAlt /> Mové las piezas a tu gusto</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Con «Mover y agrandar piezas» (debajo de la vista previa) podés arrastrar la foto, el nombre, el precio, el descuento, el contacto y el logo, y cambiarles el tamaño. También podés agregar tus propios textos y formas (estrellas, círculos, cintas…) con los botones de abajo. Las posiciones de las piezas vuelven a empezar al cambiar de plantilla o de tamaño; tus textos y formas se conservan.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Vista previa */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-100">Vista previa</h2>
            {vista ? (
              <EditorFlyer vista={vista} ancho={dimensiones.ancho} alto={dimensiones.alto} elementos={elementos} nombresExtras={Object.fromEntries(extras.map((e) => [`x_${e.id}`, nombreExtra(e)]))} onExtra={moverExtra} seleccion={seleccion} onSeleccion={setSeleccion} layout={layout} onLayout={setLayout} historial={{ deshacer, rehacer, puedeDeshacer: pasado.length > 0, puedeRehacer: futuro.length > 0 }} armando={armando} editando={editando} version={version} />
            ) : (
              <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <p className="p-6 text-center text-sm text-slate-500">{producto ? (error || 'Armando el flyer…') : 'Elegí un producto para ver el flyer.'}</p>
              </div>
            )}
            {vista && error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
            {avisos.map((a) => <p key={a} role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{a}</p>)}
            {vista && (
              <>
                {seleccion === 'logo' && <PanelLogo forma={logoForma} onForma={setLogoForma} fondo={logoPastilla} onFondo={(f) => { setLogoPastilla(f); if (f === 'ninguna') setLogoHuecos(true); }} color={logoColor} onColor={setLogoColor} relleno={logoRelleno} onRelleno={setLogoRelleno} atras={logoAtras} onAtras={setLogoAtras} huecos={logoHuecos} onHuecos={setLogoHuecos} />}
              <PanelExtras extras={extras} seleccion={seleccion} onExtras={setExtras} onSeleccion={setSeleccion} onAgregar={agregarExtra} />
              </>
            )}
            {vista && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" aria-pressed={editando} onClick={() => setEditando((v) => !v)} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${editando ? 'bg-rose-600 text-white' : 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50'}`}>
                  <FaArrowsAlt /> {editando ? 'Listo, terminé de mover' : 'Mover y agrandar piezas'}
                </button>
                {(Object.keys(layout).length > 0 || extras.length > 0) && (
                  <button type="button" onClick={() => { confirmar({ layout: {}, extras: [] }); setSeleccion(null); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FaUndo size={12} /> Restablecer</button>
                )}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={!blob} onClick={descargar} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><FaDownload /> Descargar</button>
              <button type="button" disabled={!blob} onClick={compartir} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                {typeof navigator !== 'undefined' && (navigator as any).canShare ? <FaShareAlt /> : <FaWhatsapp />} Compartir
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">En el celular se abre el menú para enviarlo por WhatsApp. En la computadora se descarga y se abre WhatsApp Web para adjuntarlo.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
