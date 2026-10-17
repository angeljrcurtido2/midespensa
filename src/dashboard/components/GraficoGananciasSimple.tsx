import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CircleDollarSign, TrendingUp } from "lucide-react";
import { getGanancias } from "../../services/ventas";

interface GananciaPeriodo { periodo: string; ventas_total: number; ganancia_total: number; }
const money = (value: number) => `Gs. ${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(value)}`;

export default function GraficoGananciasSimple() {
  const [data, setData] = useState<GananciaPeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getGanancias({ tipo: "dia", limit: 30 }).then((res) => {
      const rows = res.data.data || res.data;
      if (active && Array.isArray(rows)) setData(rows);
      else if (active) setError("Formato de datos incorrecto");
    }).catch((e) => { console.error("Error al cargar ganancias:", e); if (active) setError("Error al cargar datos"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const chartData = useMemo(() => data.slice().reverse().map((item) => ({
    fecha: new Date(item.periodo).toLocaleDateString("es-PY", { day: "2-digit", month: "short" }),
    ventas: Number(item.ventas_total) || 0,
    ganancias: Number(item.ganancia_total) || 0,
  })), [data]);
  const totalVentas = data.reduce((sum, item) => sum + (Number(item.ventas_total) || 0), 0);
  const totalGanancias = data.reduce((sum, item) => sum + (Number(item.ganancia_total) || 0), 0);

  if (loading) return <div className="h-[390px] animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />;
  if (error) return <div role="alert" className="flex min-h-56 items-center justify-center rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300">{error}</div>;
  if (!chartData.length) return <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">No hay datos disponibles para mostrar</div>;

  return <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rendimiento</p><h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Ganancias · últimos 30 días</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><TrendingUp size={14} /> Diario</span></div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30 sm:p-4"><div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300"><CircleDollarSign size={15} /> Ventas totales</div><p className="mt-2 text-lg font-bold tracking-tight text-blue-950 dark:text-blue-100 sm:text-xl">{money(totalVentas)}</p></div>
      <div className={`rounded-xl p-3 sm:p-4 ${totalGanancias >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"}`}><div className={`flex items-center gap-2 text-xs font-medium ${totalGanancias >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}><ArrowUpRight size={15} /> Ganancia</div><p className={`mt-2 text-lg font-bold tracking-tight sm:text-xl ${totalGanancias >= 0 ? "text-emerald-950 dark:text-emerald-100" : "text-rose-950 dark:text-rose-100"}`}>{money(totalGanancias)}</p></div>
    </div>
    <div className="mt-5 h-[250px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs><linearGradient id="dashSalesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.24} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient><linearGradient id="dashProfitGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 5" />
        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={24} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => new Intl.NumberFormat("es-PY", { notation: "compact", maximumFractionDigits: 1 }).format(v)} width={48} />
        <Tooltip formatter={(value) => money(Number(value) || 0)} contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,.12)" }} />
        <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#4f46e5" strokeWidth={2.5} fill="url(#dashSalesGradient)" activeDot={{ r: 5, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="ganancias" name="Ganancias" stroke="#10b981" strokeWidth={2.5} fill="url(#dashProfitGradient)" activeDot={{ r: 5, strokeWidth: 0 }} />
      </AreaChart></ResponsiveContainer>
    </div>
  </section>;
}
