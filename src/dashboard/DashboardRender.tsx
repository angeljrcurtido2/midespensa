import AlertasResumenInicio from './components/AlertasResumenInicio';
import { CHAT_IA_HABILITADO } from '../config/featureFlags';
"use client";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightCircleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import EcommerceMetrics   from "./components/EcommerceMetrics";
import GraficoEstadisticasSimple from "./components/GraficoEstadisticasVentas";
import GraficoGananciasSimple from "./components/GraficoGananciasSimple";
import ChatMetricasModal from "./components/ChatMetricasModal";
import { usePermisos } from "../hooks/usePermisos";
import { useState } from "react";
export default function DashboardRender() {
  const router = useNavigate();
  const [chatMetricasVisible, setChatMetricasVisible] = useState(false);
  // Los widgets consultan ventas, compras y cobros. Mostrarlos a quien no
  // tiene esos módulos llenaba la pantalla de errores 403 en rojo.
  const { puede, cargando } = usePermisos();

  // Mientras se resuelven los permisos no se renderiza nada: montar los
  // widgets y esconderlos después haría que igual disparen sus consultas.
  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }
  const NavButton = ({
    label,
    icon: Icon,
    href,
    color,
  }: {
    label: string;
    icon: typeof ArrowRightCircleIcon;
    href: string;
    color:
      | "indigo"
      | "emerald"
      | "sky"
      | "amber"
      | "rose"
      | "violet"
      | "cyan";
  }) => {
    const palette: Record<string, string> = {
      indigo:  "from-indigo-500   to-sky-500    hover:to-indigo-600 focus:ring-indigo-500",
      emerald: "from-emerald-500  to-teal-500   hover:to-emerald-600 focus:ring-emerald-500",
      sky:     "from-sky-500      to-cyan-500   hover:to-sky-600    focus:ring-sky-500",
      amber:   "from-amber-500    to-orange-500 hover:to-amber-600  focus:ring-amber-500",
      rose:    "from-rose-500     to-pink-500   hover:to-rose-600   focus:ring-rose-500",
      violet:  "from-violet-500   to-fuchsia-500 hover:to-violet-600 focus:ring-violet-500",
      cyan:    "from-cyan-500     to-teal-400   hover:to-cyan-600   focus:ring-cyan-500",
    };

    return (
      <button
        onClick={() => router(href)}
        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${palette[color]}
                    px-5 py-2.5 text-sm font-semibold text-white shadow-lg
                    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
      >
        <Icon className="h-5 w-5" />
        {label}
      </button>
    );
  };



  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6">
      {puede('productos') && <AlertasResumenInicio />}
      {puede('ventas') && (
        <div className="w-full"><EcommerceMetrics /></div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {puede('ventas') && <GraficoGananciasSimple/>}
        {puede('ventas') && <GraficoEstadisticasSimple/>}
      </div>
      <div className="flex flex-wrap gap-3">

          {puede('ventas') && (

            <NavButton
            label="Ventas"
            icon={CalendarDaysIcon}
            href="/ventas"
            color="indigo"
          />

          )}

          {puede('compras') && (

            <NavButton
            label="Compras"
            icon={CalendarDaysIcon}
            href="/compras"
            color="indigo"
          />

          )}

          {puede('productos') && (

            <NavButton
            label="Productos"
            icon={CalendarDaysIcon}
            href="/productos"
            color="indigo"
          />

          )}


          {puede('caja') && (

            <NavButton
            label="Ingresos"
            icon={BanknotesIcon}
            href="/movimiento/ingreso"
            color="sky"
          />

          )}

          {puede('caja') && (

            <NavButton
            label="Egresos"
            icon={BanknotesIcon}
            href="/movimiento/egreso"
            color="amber"
          />

          )}

          {puede('caja') && (

            <NavButton
            label="Movimientos"
            icon={ArrowRightCircleIcon}
            href="/movimiento/cierrecaja"
            color="rose"
          />

          )}

          {CHAT_IA_HABILITADO && (
<button
            onClick={() => setChatMetricasVisible(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:to-violet-600
                       px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            <ChartBarIcon className="h-5 w-5" />
            Chat IA Métricas
          </button>
)}
        </div>


      {CHAT_IA_HABILITADO && (
<ChatMetricasModal
        visible={chatMetricasVisible}
        onClose={() => setChatMetricasVisible(false)}
      />
)}
    </main>
  );
}
