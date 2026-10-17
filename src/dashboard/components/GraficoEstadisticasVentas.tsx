import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { getEstadisticasVentas } from "../../services/ventas";

interface EstadisticasData { ventas: number[]; ganancias: number[]; }
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const formatMoney = (value: number) => `Gs. ${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(value)}`;

export default function GraficoEstadisticasSimple() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    getEstadisticasVentas(year).then((res) => { if (active) setData(res.data); })
      .catch((e) => { console.error(e); if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [year]);

  const chartData = data ? meses.map((mes, i) => ({ mes, ventas: Number(data.ventas[i]) || 0, ganancias: Number(data.ganancias[i]) || 0 })) : [];
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tendencia anual</p><h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><ChartNoAxesCombined className="text-indigo-600 dark:text-indigo-400" size={20} /> Ventas y ganancias</h2></div>
      <select aria-label="Año de estadísticas" value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-indigo-950">{Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
    </div>
    {loading ? <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : error ? <div role="alert" className="mt-5 flex h-[280px] items-center justify-center rounded-xl bg-rose-50 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">No se pudieron cargar las estadísticas.</div> : <div className="mt-5 h-[250px] w-full sm:h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
      <defs><linearGradient id="annualSalesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient><linearGradient id="annualProfitGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.18} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 5" /><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => new Intl.NumberFormat("es-PY", { notation: "compact", maximumFractionDigits: 1 }).format(v)} width={48} />
      <Tooltip formatter={(value) => formatMoney(Number(value) || 0)} contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,.12)" }} /><Area type="monotone" dataKey="ventas" name="Ventas" stroke="#4f46e5" strokeWidth={2.5} fill="url(#annualSalesGradient)" activeDot={{ r: 5, strokeWidth: 0 }} /><Area type="monotone" dataKey="ganancias" name="ganancias" stroke="#10b981" strokeWidth={2.5} fill="url(#annualProfitGradient)" activeDot={{ r: 5, strokeWidth: 0 }} />
    </AreaChart></ResponsiveContainer></div>}
  </section>;
}
