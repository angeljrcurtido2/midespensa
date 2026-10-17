import { useEffect, useState } from 'react';
import { animate, AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, TrendingUp, Wallet, Receipt } from 'lucide-react';

/** Contador que sube hasta su valor al aparecer (guaraníes con separador de miles). */
function Cifra({ valor, retraso = 0 }: { valor: number; retraso?: number }) {
  const reducir = useReducedMotion();
  const [n, setN] = useState(reducir ? valor : 0);
  useEffect(() => {
    if (reducir) { setN(valor); return; }
    const c = animate(0, valor, { duration: 1.6, delay: retraso, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [valor, retraso, reducir]);
  return <>{n.toLocaleString('es-PY')}</>;
}

const COBROS = [
  { quien: 'Supermercado El Ahorro', monto: 14776 },
  { quien: 'Almacén Doña Lola', monto: 86500 },
  { quien: 'Carlos Benítez', monto: 245000 },
];

// Serie de ventas del día (normalizada 0-1) dibujada como curva suave.
const PUNTOS = [0.18, 0.26, 0.22, 0.38, 0.34, 0.5, 0.46, 0.62, 0.58, 0.78, 0.72, 0.9];
const curva = (w: number, h: number) => {
  const p = PUNTOS.map((v, i) => [(i / (PUNTOS.length - 1)) * w, h - v * h * 0.86 - 6] as const);
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1]; const [x1, y1] = p[i]; const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

/** Vista previa del sistema: tarjetas de resumen, gráfico y un aviso de cobro que aparece solo. */
export default function VistaPrevia() {
  const reducir = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducir) return;
    const t = setInterval(() => setI((x) => (x + 1) % COBROS.length), 3800);
    return () => clearInterval(t);
  }, [reducir]);

  const W = 520, H = 150;
  const trazo = curva(W, H);
  const entrada = (d: number) => reducir ? {} : ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <motion.div {...entrada(0.25)} className="rounded-2xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(8,30,90,.55)] ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Resumen de hoy</p>
            <p className="text-xs text-slate-500">Actualizado en tiempo real</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
            En vivo
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { t: 'Ventas', v: 4820500, Icono: TrendingUp, extra: '+12,4 %', color: 'text-blue-600 bg-blue-50' },
            { t: 'Cobros', v: 1240000, Icono: Receipt, extra: '8 cuotas', color: 'text-sky-600 bg-sky-50' },
            { t: 'Saldo de caja', v: 3915200, Icono: Wallet, extra: 'cuadra', color: 'text-indigo-600 bg-indigo-50' },
          ].map((k, n) => (
            <div key={k.t} className="rounded-xl border border-slate-200 p-3">
              <span className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${k.color}`}><k.Icono size={15} strokeWidth={2.2} /></span>
              <p className="text-[11px] font-medium text-slate-500">{k.t}</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-slate-900">₲ <Cifra valor={k.v} retraso={0.5 + n * 0.12} /></p>
              <p className="mt-0.5 text-[11px] font-medium text-emerald-600">{k.extra}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">Ventas por hora</span><span>08:00 – 18:00</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[130px] w-full" role="img" aria-label="Gráfico de ventas del día">
            <defs>
              <linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".22" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e2e8f0" strokeDasharray="3 5" />)}
            <motion.path d={`${trazo} L ${W} ${H} L 0 ${H} Z`} fill="url(#area)" initial={reducir ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} />
            <motion.path d={trazo} fill="none" stroke="#2563eb" strokeWidth="2.6" strokeLinecap="round" initial={reducir ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 1.7, ease: 'easeInOut' }} />
            <motion.circle cx={W} cy={H - PUNTOS[PUNTOS.length - 1] * H * 0.86 - 6} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2.6" initial={reducir ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.1, type: 'spring' }} />
          </svg>
        </div>
      </motion.div>

      {/* Aviso flotante: un cobro registrado */}
      <div className="pointer-events-none absolute -bottom-7 -right-3 w-[290px] sm:-right-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={reducir ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducir ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.45, delay: i === 0 ? 1.6 : 0 }}
            className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-[0_18px_40px_-12px_rgba(8,30,90,.5)] ring-1 ring-black/5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-900">Cobro registrado</p>
              <p className="truncate text-[11px] text-slate-500">{COBROS[i].quien}</p>
            </div>
            <p className="ml-auto text-[13px] font-semibold tabular-nums text-slate-900">₲ {COBROS[i].monto.toLocaleString('es-PY')}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
