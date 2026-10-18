import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Banknote, Bell, ClipboardList, HandCoins, PackagePlus, ReceiptText, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { obtenerResumenVentasDia, getProductosMasVendidos, listarDeudasVentaAgrupadasPorClienteSinPaginar } from '../services/ventas';
import { getCajaAbierta } from '../services/movimiento';
import { getResumenAlertas, type ResumenAlertas } from '../services/alertasInventario';
import { usePermisos } from '../hooks/usePermisos';
import GraficoEstadisticasSimple from './components/GraficoEstadisticasVentas';

const gs = (n: number | string | null | undefined) => `Gs. ${Math.round(Number(n) || 0).toLocaleString('es-PY')}`;

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};
const fechaLarga = () => {
  const t = new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

type Tono = 'naranja' | 'verde' | 'ambar' | 'rojo' | 'piedra';
const TONOS: Record<Tono, { barra: string; icono: string }> = {
  naranja: { barra: 'bg-orange-500', icono: 'bg-orange-100 text-orange-700' },
  verde: { barra: 'bg-emerald-500', icono: 'bg-emerald-100 text-emerald-700' },
  ambar: { barra: 'bg-amber-500', icono: 'bg-amber-100 text-amber-800' },
  rojo: { barra: 'bg-red-500', icono: 'bg-red-100 text-red-700' },
  piedra: { barra: 'bg-stone-400', icono: 'bg-stone-100 text-stone-600' },
};

function Dato({ to, titulo, valor, detalle, tono, icono, cargando }: { to: string; titulo: string; valor: ReactNode; detalle?: ReactNode; tono: Tono; icono: ReactNode; cargando?: boolean }) {
  const t = TONOS[tono];
  return (
    <Link to={to} className="group relative flex min-h-[124px] flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white p-4 shadow-sm sm:p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/30">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${t.barra}`} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold text-stone-600 sm:text-sm">{titulo}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl sm:h-10 sm:w-10 ${t.icono}`}>{icono}</span>
      </div>
      {cargando ? <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-stone-100" /> : <p className="mt-2 break-words text-xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-[26px]">{valor}</p>}
      {detalle && !cargando && <p className="mt-auto pt-2 text-xs font-semibold text-stone-500">{detalle}</p>}
    </Link>
  );
}

function Accion({ to, titulo, ayuda, icono, principal }: { to: string; titulo: string; ayuda: string; icono: ReactNode; principal?: boolean }) {
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-3xl border-2 p-4 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/30 ${principal ? 'border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-700/20 hover:bg-orange-700' : 'border-orange-100 bg-white text-stone-800 hover:border-orange-300'}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${principal ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-700'}`}>{icono}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold leading-tight">{titulo}</span>
        <span className={`mt-0.5 block text-xs leading-snug ${principal ? 'text-orange-50' : 'text-stone-500'}`}>{ayuda}</span>
      </span>
    </Link>
  );
}

interface Top { nombre_producto?: string; nombre?: string; total_vendido?: number | string; cantidad?: number | string; cantidad_total?: number | string }

/** Inicio de Mi Despensa: lo que pasó hoy, lo que falta atender y los atajos de lo que más se hace. */
export default function InicioDespensa() {
  const { puede } = usePermisos();
  const verVentas = puede('ventas');
  const verCaja = puede('caja');
  const verProductos = puede('productos');
  const verCompras = puede('compras');

  const [hoy, setHoy] = useState<{ total: number; ayer: number } | null>(null);
  const [caja, setCaja] = useState<boolean | null>(null);
  const [deuda, setDeuda] = useState<{ total: number; clientes: number } | null>(null);
  const [alertas, setAlertas] = useState<ResumenAlertas | null>(null);
  const [top, setTop] = useState<Top[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.allSettled([
      verVentas ? obtenerResumenVentasDia() : Promise.reject(),
      verCaja ? getCajaAbierta() : Promise.reject(),
      verVentas ? listarDeudasVentaAgrupadasPorClienteSinPaginar() : Promise.reject(),
      verProductos ? getResumenAlertas() : Promise.reject(),
      verVentas ? getProductosMasVendidos(5) : Promise.reject(),
    ]).then(([v, c, d, a, t]) => {
      if (!vivo) return;
      if (v.status === 'fulfilled') setHoy({ total: Number(v.value.data?.totalHoy) || 0, ayer: Number(v.value.data?.totalAyer) || 0 });
      if (c.status === 'fulfilled') setCaja(!!c.value.data?.abierta);
      if (d.status === 'fulfilled') { const x = d.value.data; setDeuda({ total: Number(x?.totals?.saldo ?? x?.totals?.totalDeuda) || 0, clientes: Number(x?.totalItems ?? x?.data?.length) || 0 }); }
      if (a.status === 'fulfilled') setAlertas(a.value.data);
      if (t.status === 'fulfilled') setTop(Array.isArray(t.value.data) ? t.value.data : t.value.data?.data ?? []);
    }).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [verVentas, verCaja, verProductos]);

  const porAtender = useMemo(() => (alertas ? alertas.vencidos + alertas.por_vencer_30 + alertas.reposicion : 0), [alertas]);
  const variacion = hoy && hoy.ayer > 0 ? Math.round(((hoy.total - hoy.ayer) / hoy.ayer) * 100) : null;

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-8 px-1 pb-10 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">{fechaLarga()}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{saludo()}, ¿cómo va la despensa?</h1>
        </div>
        {verCaja && caja !== null && (
          <Link to="/movimiento/cierrecaja" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${caja ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${caja ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {caja ? 'Caja abierta' : 'Caja cerrada · abrila para vender'}
          </Link>
        )}
      </header>

      <section aria-labelledby="hoy">
        <h2 id="hoy" className="mb-3 text-lg font-extrabold text-stone-900">Hoy</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {verVentas && (
            <Dato to="/ventas" titulo="Vendiste hoy" tono="naranja" icono={<ShoppingCart size={20} />} cargando={cargando && !hoy}
              valor={gs(hoy?.total)}
              detalle={hoy ? (variacion === null ? (hoy.total > 0 ? 'Todavía no hubo ventas ayer' : 'Todavía no vendiste hoy') : <span className="inline-flex items-center gap-1">{variacion >= 0 ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-600" />}{Math.abs(variacion)}% {variacion >= 0 ? 'más' : 'menos'} que ayer</span>) : undefined} />
          )}
          {verVentas && (
            <Dato to="/ventas/cobrodeuda" titulo="Te deben" tono={deuda && deuda.total > 0 ? 'ambar' : 'piedra'} icono={<HandCoins size={20} />} cargando={cargando && !deuda}
              valor={gs(deuda?.total)} detalle={deuda ? (deuda.clientes > 0 ? `${deuda.clientes} ${deuda.clientes === 1 ? 'cliente' : 'clientes'} con fiado` : 'Nadie te debe nada') : undefined} />
          )}
          {verProductos && (
            <Dato to="/productos/alertas" titulo="Para atender" tono={porAtender > 0 ? 'rojo' : 'verde'} icono={<Bell size={20} />} cargando={cargando && !alertas}
              valor={porAtender > 0 ? `${porAtender} ${porAtender === 1 ? 'aviso' : 'avisos'}` : 'Todo al día'}
              detalle={alertas ? (porAtender > 0 ? [alertas.vencidos && `${alertas.vencidos} vencidos`, alertas.por_vencer_30 && `${alertas.por_vencer_30} por vencer`, alertas.reposicion && `${alertas.reposicion} para reponer`].filter(Boolean).join(' · ') : 'Sin vencidos ni faltantes') : undefined} />
          )}
          {verCaja && (
            <Dato to="/movimiento/cierrecaja" titulo="Caja" tono={caja ? 'verde' : 'piedra'} icono={<Wallet size={20} />} cargando={cargando && caja === null}
              valor={caja ? 'Abierta' : 'Cerrada'} detalle={caja ? 'Tocá para ver o cerrar la caja' : 'Tocá para abrirla'} />
          )}
        </div>
      </section>

      <section aria-labelledby="atajos">
        <h2 id="atajos" className="mb-3 text-lg font-extrabold text-stone-900">¿Qué querés hacer?</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {verVentas && <Accion principal to="/ventas/nueva" titulo="Vender" ayuda="Abrí el mostrador y cobrá" icono={<ShoppingCart size={24} />} />}
          {verCompras && <Accion to="/compras/nueva" titulo="Recibir mercadería" ayuda="Cargá lo que te trajo el proveedor" icono={<Truck size={22} />} />}
          {verProductos && <Accion to="/productos/nuevo" titulo="Nuevo producto" ayuda="Agregá un producto a tu lista" icono={<PackagePlus size={22} />} />}
          {verVentas && <Accion to="/ventas/cobrodeuda" titulo="Cobrar fiado" ayuda="Registrá lo que te paga un cliente" icono={<Banknote size={22} />} />}
          {verCaja && <Accion to="/movimiento/cierrecaja" titulo="Caja del día" ayuda="Abrí, mirá o cerrá la caja" icono={<Wallet size={22} />} />}
          {verVentas && <Accion to="/ventas" titulo="Ventas anteriores" ayuda="Buscá o reimprimí un ticket" icono={<ReceiptText size={22} />} />}
        </div>
      </section>

      {verVentas && (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" aria-label="Más vendidos y tendencia">
          <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><ClipboardList size={18} className="text-orange-700" /><h2 className="text-lg font-extrabold text-stone-900">Lo que más se vende</h2></div>
            {top === null && cargando ? <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-xl bg-stone-100" />)}</div>
              : top && top.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {top.slice(0, 5).map((p, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-2xl bg-orange-50/60 px-3 py-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-extrabold text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-800">{p.nombre_producto || p.nombre}</span>
                      <span className="text-xs font-bold text-stone-500">{Number(p.total_vendido ?? p.cantidad_total ?? p.cantidad) || 0} u.</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Cuando empieces a vender vas a ver acá tus productos estrella.</p>}
          </div>
          <GraficoEstadisticasSimple />
        </section>
      )}
    </main>
  );
}
