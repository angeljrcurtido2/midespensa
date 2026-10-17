import { useCallback, useEffect, useRef, useState } from 'react';
import { Barcode, CheckCircle2, Package, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { getProductosPaginated, urlImagenProducto } from '../../services/productos';
import { urlWebSocket } from '../../services/cajasEnVivo';

type Producto = Record<string, any>;
type EstadoConexion = 'conectando' | 'conectado' | 'reconectando' | 'sin_sesion';

const moneda = (valor: unknown) => `Gs. ${Number(valor || 0).toLocaleString('es-PY')}`;

export default function LectorCodigoBarrasWeb() {
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [duplicados, setDuplicados] = useState<Producto[]>([]);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>('conectando');
  const [estado, setEstado] = useState('Abrí SysApp con la misma cuenta y escaneá un producto.');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [historial, setHistorial] = useState<Array<{ codigo: string; nombre: string; hora: string }>>([]);
  const ws = useRef<WebSocket | null>(null);
  const colaLecturas = useRef<string[]>([]);
  const procesandoCola = useRef(false);
  const ultimaLectura = useRef({ valor: '', tiempo: 0 });

  const buscarCodigo = useCallback(async (valor: string) => {
    setCodigo(valor);
    setBuscando(true);
    setError('');
    setProducto(null);
    setDuplicados([]);
    try {
      const respuesta = await getProductosPaginated({ page: 1, limit: 100, search: valor });
      const body = respuesta.data;
      const lista: Producto[] = Array.isArray(body) ? body : body?.data || body?.productos || [];
      const exactos = lista.filter((p) => String(p.cod_barra ?? '').trim() === valor);
      if (exactos.length === 1) {
        const encontrado = exactos[0];
        setProducto(encontrado);
        setEstado('Código recibido desde SysApp. Los datos del producto se completaron automáticamente.');
        setHistorial((actual) => [{ codigo: valor, nombre: encontrado.nombre_producto || 'Producto', hora: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) }, ...actual].slice(0, 8));
      } else if (exactos.length > 1) {
        setDuplicados(exactos);
        setEstado('Hay más de un producto con este código. Elegí el registro correcto.');
      } else {
        setError('No encontramos un producto con ese código de barras.');
        setEstado('Código recibido desde SysApp, pero no hay un producto asociado.');
      }
    } catch (e) {
      console.error('Error al buscar producto por código de barras:', e);
      setError('No se pudo consultar el producto. Revisá la conexión e intentá otra vez.');
    } finally {
      setBuscando(false);
    }
  }, []);

  const procesarCola = useCallback(async () => {
    if (procesandoCola.current) return;
    procesandoCola.current = true;
    while (colaLecturas.current.length) {
      const siguiente = colaLecturas.current.shift();
      if (siguiente) await buscarCodigo(siguiente);
    }
    procesandoCola.current = false;
  }, [buscarCodigo]);

  const recibirCodigo = useCallback((valor: string) => {
    const limpio = valor.trim();
    const ahora = Date.now();
    if (!limpio || (ultimaLectura.current.valor === limpio && ahora - ultimaLectura.current.tiempo < 1400)) return;
    ultimaLectura.current = { valor: limpio, tiempo: ahora };
    colaLecturas.current.push(limpio);
    setCodigo(limpio);
    setEstado('Código recibido desde SysApp. Buscando el producto…');
    void procesarCola();
  }, [procesarCola]);

  useEffect(() => {
    let activa = true;
    let intento = 0;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let conexion: WebSocket | null = null;

    const conectar = () => {
      if (!activa) return;
      const token = localStorage.getItem('auth_token');
      if (!token) { setEstadoConexion('sin_sesion'); return; }
      setEstadoConexion(intento ? 'reconectando' : 'conectando');
      try {
        const socketActual = new WebSocket(urlWebSocket());
        conexion = socketActual;
        ws.current = socketActual;
        socketActual.onopen = () => socketActual.send(JSON.stringify({ type: 'auth', token, canal: 'lector-web' }));
        socketActual.onmessage = (evento) => {
          let mensaje: any;
          try { mensaje = JSON.parse(String(evento.data)); } catch { return; }
          if (mensaje.type === 'ready') {
            intento = 0;
            setEstadoConexion('conectado');
            setError('');
            setEstado('Conectado a SysApp. Escaneá un producto con la cámara del teléfono.');
          } else if (mensaje.type === 'barcode') recibirCodigo(String(mensaje.codigo || ''));
          else if (mensaje.type === 'error') setError(mensaje.error || 'No se pudo conectar el lector.');
        };
        socketActual.onclose = () => {
          if (ws.current === socketActual) ws.current = null;
          if (!activa) return;
          setEstadoConexion('reconectando');
          setEstado('Se perdió la conexión; intentando reconectar…');
          intento += 1;
          reintento = setTimeout(conectar, Math.min(1000 * 2 ** intento, 15000));
        };
        socketActual.onerror = () => {};
      } catch {
        setEstadoConexion('reconectando');
        intento += 1;
        reintento = setTimeout(conectar, Math.min(1000 * 2 ** intento, 15000));
      }
    };

    conectar();
    return () => {
      activa = false;
      if (reintento) clearTimeout(reintento);
      conexion?.close();
      if (ws.current === conexion) ws.current = null;
    };
  }, [recibirCodigo]);

  const elegirDuplicado = (elegido: Producto) => {
    setProducto(elegido);
    setDuplicados([]);
    setEstado('Producto identificado. La ficha corresponde al código recibido desde SysApp.');
    setHistorial((actual) => [{ codigo, nombre: elegido.nombre_producto || 'Producto', hora: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) }, ...actual].slice(0, 8));
  };

  const conexionLista = estadoConexion === 'conectado';

  return (
    <div className="mx-auto w-full max-w-none space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Barcode size={23} /></span>
          <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Escaneo remoto desde SysApp</h2><p className="text-sm text-slate-500 dark:text-slate-400">La cámara del teléfono envía el código a esta pantalla por Internet.</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${conexionLista ? 'bg-emerald-50 text-emerald-700' : estadoConexion === 'sin_sesion' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
          {conexionLista ? <Wifi size={15} /> : estadoConexion === 'sin_sesion' ? <WifiOff size={15} /> : <RefreshCw size={14} className="animate-spin" />}
          {conexionLista ? 'Conectado' : estadoConexion === 'sin_sesion' ? 'Sesión requerida' : estadoConexion === 'reconectando' ? 'Reconectando' : 'Conectando'}
        </span>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${conexionLista ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><Smartphone size={20} /></span><div><h3 className="font-bold text-slate-900 dark:text-white">Lector del teléfono</h3><p className="text-sm text-slate-500">{estado}</p></div></div>
              <span className={`h-2.5 w-2.5 rounded-full ${conexionLista ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Último código recibido</span>
              <p className="mt-1 min-h-7 font-mono text-xl font-bold text-slate-900 dark:text-white">{codigo || 'Esperando lectura…'}</p>
              {buscando && <p className="mt-1 text-xs text-blue-700">Buscando producto en el inventario…</p>}
            </div>
            {error && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">1</span><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Abrí SysApp</p><p className="mt-1 text-xs text-slate-500">Iniciá sesión con la misma cuenta que usás en esta web.</p></div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">2</span><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Escaneá con la cámara</p><p className="mt-1 text-xs text-slate-500">Usá el lector habitual de productos en la app; la lectura también llegará aquí.</p></div>
            </div>
          </section>

          {producto ? (
            <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900 dark:bg-slate-900" aria-live="polite">
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={18} /> Producto encontrado</div>
              <div className="flex flex-wrap items-start gap-4 p-4">
                {producto.imagen ? <img src={urlImagenProducto(producto.imagen)} alt="" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800"><Package size={28} /></span>}
                <div className="min-w-[220px] flex-1"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{producto.nombre_producto}</h3><p className="mt-1 font-mono text-sm text-slate-500">Código: {producto.cod_barra || codigo}</p>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4"><p><span className="block text-xs text-slate-500">Categoría</span>{producto.categoria || producto.nombre_categoria || '—'}</p><p><span className="block text-xs text-slate-500">Unidad</span>{producto.unidad_medida || 'UNIDAD'}</p><p><span className="block text-xs text-slate-500">Stock</span>{producto.stock ?? '—'}</p><p><span className="block text-xs text-slate-500">Precio de venta</span>{moneda(producto.precio_venta)}</p></div>
                </div>
              </div>
            </section>
          ) : duplicados.length > 0 ? (
            <section className="space-y-2 rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:bg-slate-900"><h3 className="text-sm font-bold text-slate-800 dark:text-white">Elegí el producto correcto</h3>{duplicados.map((p) => <button key={p.idproducto} type="button" onClick={() => elegirDuplicado(p)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-blue-400 dark:border-slate-700"><span className="font-semibold text-slate-800 dark:text-white">{p.nombre_producto}</span><span className="text-xs text-slate-500">Stock {p.stock ?? '—'}</span></button>)}</section>
          ) : <section className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900"><div><Barcode className="mx-auto text-slate-300" size={32} /><p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">La ficha del producto aparecerá aquí</p><p className="mt-1 text-xs text-slate-500">Cuando SysApp envíe un código, buscaremos el producto automáticamente.</p></div></section>}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 dark:text-white">Lecturas recientes</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{historial.length}</span></div>
          {historial.length ? <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{historial.map((item, i) => <li key={`${item.codigo}-${i}`} className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{item.nombre}</p><p className="font-mono text-xs text-slate-500">{item.codigo}</p></div><time className="shrink-0 text-xs text-slate-400">{item.hora}</time></li>)}</ul> : <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800">Todavía no hay productos escaneados.</p>}
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"><p className="font-semibold">Conexión por Internet</p><p>La web recibe las lecturas de SysApp usando tu sesión y una conexión cifrada en tiempo real. No necesitás conectar el teléfono a la computadora.</p></div>
        </aside>
      </div>
    </div>
  );
}
