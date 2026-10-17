import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { getVentasMensuales } from "../../services/ventas";
import { getComprasMonth } from "../../services/compras";
import { usePermisos } from "../../hooks/usePermisos";

const fmtMoney = (value: number | string) => new Intl.NumberFormat("es-PY", {
  style: "currency", currency: "PYG", maximumFractionDigits: 0,
}).format(Number(value) || 0);
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p><h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{title}</h2></div>;
}

function MetricCard({ title, value, icon: Icon, tone, detail }: { title: string; value: string; icon: typeof ArrowUpRight; tone: string; detail: string }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p><p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{value}</p><p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{detail}</p></div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-sm`}><Icon size={19} strokeWidth={2.2} /></span></div>
  </article>;
}

export default function EcommerceMetrics() {
  const [ventasMensuales, setVentasMensuales] = useState<number[]>([]);
  const [comprasMensuales, setComprasMensuales] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  // Solo se piden y se muestran los resúmenes de los módulos que la persona puede ver: un cajero sin permiso de
  // compras recibía un 403 en cada carga del inicio.
  const { cargando: cargandoPermisos, puede } = usePermisos();
  const verVentas = puede("ventas");
  const verCompras = puede("compras");

  useEffect(() => {
    if (cargandoPermisos) return;
    let active = true;
    const anio = new Date().getFullYear();
    Promise.allSettled([
      verVentas ? getVentasMensuales(anio) : Promise.reject(new Error("sin permiso")),
      verCompras ? getComprasMonth(anio) : Promise.reject(new Error("sin permiso")),
    ]).then(([ventas, compras]) => {
      if (!active) return;
      if (ventas.status === "fulfilled") { const rows = ventas.value.data.data || ventas.value.data; if (Array.isArray(rows)) setVentasMensuales(rows); }
      if (compras.status === "fulfilled") { const rows = compras.value.data.data || compras.value.data; if (Array.isArray(rows)) setComprasMensuales(rows); }
      if ((verVentas || verCompras) && (!verVentas || ventas.status === "rejected") && (!verCompras || compras.status === "rejected")) setErr(true);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cargandoPermisos, verVentas, verCompras]);

  const ultimos3Meses = (datos: number[]) => Array.from({ length: 3 }, (_, offset) => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - (2 - offset));
    return { nombre: meses[fecha.getMonth()], valor: fecha.getFullYear() === new Date().getFullYear() ? datos[fecha.getMonth()] || 0 : 0 };
  });

  if (loading) return <div className="space-y-6" aria-label="Cargando resumen"><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}</div></div>;
  if (err) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">No se pudieron cargar los resumenes mensuales.</div>;

  return <div className="space-y-6">
    {verVentas && <section><SectionTitle eyebrow="Actividad" title="Ventas de los últimos 3 meses" /><div className="grid gap-3 sm:grid-cols-3">
      {ultimos3Meses(ventasMensuales).map((mes, i) => <MetricCard key={`venta-${mes.nombre}-${i}`} title={mes.nombre} value={fmtMoney(mes.valor)} icon={ArrowUpRight} tone="from-blue-500 to-cyan-500" detail="Ventas del mes" />)}
    </div></section>}
    {verCompras && <section><SectionTitle eyebrow="Abastecimiento" title="Compras de los últimos 3 meses" /><div className="grid gap-3 sm:grid-cols-3">
      {ultimos3Meses(comprasMensuales).map((mes, i) => <MetricCard key={`compra-${mes.nombre}-${i}`} title={mes.nombre} value={fmtMoney(mes.valor)} icon={ShoppingBag} tone="from-emerald-500 to-teal-500" detail="Compras del mes" />)}
    </div></section>}
  </div>;
}